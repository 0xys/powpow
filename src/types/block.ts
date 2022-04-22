import { toBufferBE } from 'bigint-buffer'
import { Transaction } from './transaction'
import { createHash } from 'crypto';

export class Block {
    constructor(
        private version: bigint,
        private height: bigint,
        private prevBlockHash: Buffer,
        private transactions: Transaction[],
        private nonce: bigint,
        private difficultyTarget: Buffer = Buffer.allocUnsafe(4))
    {

    }

    // 4 byte
    getVersion = (): bigint => {
        return this.version
    }

    // 8 byte
    getHeight = (): bigint => {
        return this.height
    }

    // 32 byte
    getPrevBlockHash = (): Buffer => {
        return this.prevBlockHash
    }

    //  4 byte
    getDifficultyTarget = (): Buffer => {
        return this.difficultyTarget
    }

    getTransactions = (): Transaction[] => {
        return this.transactions
    }

    // 4 byte
    getNonce = (): bigint => {
        return this.nonce
    }

    hash = (): Buffer => {
        const body = this.encode()
        const hashed = createHash('sha256').update(body).digest()
        return hashed
    }

    encode = (): Buffer => {
        let bufs: Buffer[] = []

        const versionBuf = toBufferBE(this.version, 4)
        bufs.push(versionBuf)

        const numberBuf = toBufferBE(this.height, 8)
        bufs.push(numberBuf)

        bufs.push(this.prevBlockHash)

        bufs.push(this.difficultyTarget)

        const lenBuf = conv(this.transactions.length)
        bufs.push(lenBuf)

        for (const tx of this.transactions) {
            bufs.push(tx.encode())
        }

        const nonceBuf = toBufferBE(this.nonce, 4)
        bufs.push(nonceBuf)

        return Buffer.concat(bufs)
    }
}

const conv = (num: number): Buffer => {
    const arr = [
        (num >> 24) & 255,
        (num >> 16) & 255,
        (num >> 8) & 255,
        num & 255,
    ];
    return Buffer.from(arr)
}