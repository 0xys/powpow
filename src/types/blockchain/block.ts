import { toBigIntBE, toBufferBE } from 'bigint-buffer'
import { Transaction } from './transaction'
import { createHash } from 'crypto';
import { merkle } from '../../utils/merkle';

export class Block {
    private difficultyTarget: bigint
    private merkleRoot: Buffer
    constructor(
        private version: bigint,
        private height: bigint,
        private prevBlockHash: Buffer,
        private transactions: Transaction[],
        private nonce: bigint,
        difficultyTarget?: bigint)
    {
        if (difficultyTarget) {
            this.difficultyTarget = difficultyTarget
        }else{
            //  initial difficulty
            this.difficultyTarget = toBigIntBE(Buffer.from([0xee, 0x00, 0x00, 0x00]))
        }
        this.merkleRoot = Block.calculateMerkleRoot(transactions)
    }

    // 4 byte
    getVersion = (): bigint => {
        return this.version
    }

    // 4 byte
    getHeight = (): bigint => {
        return this.height
    }

    // 32 byte
    getPrevBlockHash = (): Buffer => {
        return this.prevBlockHash
    }
    getPrevBlockHashString = (): string => {
        return this.getPrevBlockHash().toString('hex')
    }

    //  4 byte
    getDifficultyTarget = (): bigint => {
        return this.difficultyTarget
    }
    getDifficultyTargetBuffer = (): Buffer => {
        return toBufferBE(this.difficultyTarget, 4)
    }

    // 32 byte
    getMerkleRoot = (): Buffer => {
        return this.merkleRoot
    }
    getTransactions = (): Transaction[] => {
        return this.transactions
    }

    // 4 byte
    getNonce = (): bigint => {
        return this.nonce
    }

    hash = (): Buffer => {
        const header = this.encodeHeader()
        const hashed = createHash('sha256').update(header).digest()
        return hashed
    }
    hashString = (): string => {
        return this.hash().toString('hex')
    }

    setNonce = (nonce: bigint) => {
        this.nonce = nonce
    }
    mutateNonce = (nonce: bigint): Block => {
        return new Block(this.version, this.height, this.prevBlockHash, this.transactions, nonce, this.difficultyTarget)
    }
    hashWith = (nonce: bigint): Buffer => {
        const header = this._encodeHeader(nonce)
        const hashed = createHash('sha256').update(header).digest()
        return hashed
    }

    encode = (): Buffer => {
        let bufs: Buffer[] = []

        const versionBuf = toBufferBE(this.version, 4)
        bufs.push(versionBuf)

        const heightBuf = toBufferBE(this.height, 4)
        bufs.push(heightBuf)

        bufs.push(this.prevBlockHash)

        bufs.push(this.getDifficultyTargetBuffer())

        const lenBuf = conv(this.transactions.length)
        bufs.push(lenBuf)

        // note: merkle root not included

        for (const tx of this.transactions) {
            bufs.push(tx.encode())
        }

        const nonceBuf = toBufferBE(this.nonce, 4)
        bufs.push(nonceBuf)

        return Buffer.concat(bufs)
    }
    encodeToHex = (): string => {
        return this.encode().toString('hex')
    }

    encodeHeader = (): Buffer => {
        return this._encodeHeader(this.nonce)
    }
    encodeHeaderHex = (): string => {
        return this._encodeHeader(this.nonce).toString('hex')
    }
    
    private _encodeHeader = (nonce: bigint): Buffer => {
        let bufs: Buffer[] = []

        const versionBuf = toBufferBE(this.version, 4)
        bufs.push(versionBuf)

        const heightBuf = toBufferBE(this.height, 4)
        bufs.push(heightBuf)

        bufs.push(this.prevBlockHash)

        bufs.push(this.getDifficultyTargetBuffer())

        const lenBuf = conv(this.transactions.length)
        bufs.push(lenBuf)

        bufs.push(this.merkleRoot)

        const nonceBuf = toBufferBE(nonce, 4)
        bufs.push(nonceBuf)

        return Buffer.concat(bufs)
    }

    private static calculateMerkleRoot = (txs: Transaction[]): Buffer => {
        return merkle(txs.map(x => x.hash()))
    }

    static decode = (blob: Buffer): Block => {
        const versionBuf = blob.slice(0, 4)
        const version = toBigIntBE(versionBuf)

        const heightBuf = blob.slice(4, 8)
        const height = toBigIntBE(heightBuf)

        const prevBlockHash = blob.slice(8, 40)

        const difficultyTargetBuf = blob.slice(40, 44)
        const difficultyTarget = toBigIntBE(difficultyTargetBuf)

        const lenBuf = blob.slice(44, 48)
        const len = Number(toBigIntBE(lenBuf))

        let txs: Transaction[] = []
        let offset = 0
        for (let i = 0; i < len; i++) {
            const tx = Transaction.decode(blob.slice(48 + offset))
            txs.push(tx)
            offset += tx.encodedLen()
        }

        const nonceBuf = blob.slice(48 + offset, 48 + offset + 4)
        const nonce = toBigIntBE(nonceBuf)

        return new Block(version, height, prevBlockHash, txs, nonce, difficultyTarget)
    }

    static Genesis = (version: bigint, minerAddress: Buffer): Block => {
        const transactions: Transaction[] = [
            Transaction.Coinbase(BigInt(0), minerAddress, BigInt(1_000_000))
        ] 
        return new Block(version, BigInt(0), Buffer.allocUnsafe(32).fill(0), transactions, BigInt(0))
    }
}

//  4 byte
const conv = (num: number): Buffer => {
    const arr = [
        (num >> 24) & 255,
        (num >> 16) & 255,
        (num >> 8) & 255,
        num & 255,
    ];
    return Buffer.from(arr)
}