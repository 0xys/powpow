import { toBigIntBE, toBufferBE } from "bigint-buffer"
import { createHash } from 'crypto';

export class BlockHeader {
    difficulty: bigint
    version: bigint
    height: bigint
    prevBlockHash: Buffer
    merkleRoot: Buffer
    nonce: bigint
    constructor(
        version: bigint,
        height: bigint,
        prevBlockHash: Buffer,
        merkleRoot: Buffer,
        nonce: bigint,
        difficulty?: bigint)
    {
        this.version = version
        this.height = height
        this.prevBlockHash = prevBlockHash
        this.merkleRoot = merkleRoot
        this.nonce = nonce

        if (difficulty) {
            this.difficulty = difficulty
        }else{
            //  initial difficulty
            this.difficulty = toBigIntBE(Buffer.from([0x00, 0x00, 0x00, 0x00]))
        }
    }

    // 4 byte
    getVersion = (): bigint => {
        return this.version
    }
    getVersionBuffer = (): Buffer => {
        return toBufferBE(this.getVersion(), 4)
    }
    setVersion = (version: Buffer) => {
        this.version = toBigIntBE(version)
    }

    // 4 byte
    getHeight = (): bigint => {
        return this.height
    }
    getHeightBuffer = (): Buffer => {
        return toBufferBE(this.getHeight(), 4)
    }
    setHeight = (height: Buffer) => {
        this.height = toBigIntBE(height)
    }

    // 32 byte
    getPrevBlockHash = (): Buffer => {
        return this.prevBlockHash
    }
    getPrevBlockHashString = (): string => {
        return this.getPrevBlockHash().toString('hex')
    }
    setPrevBlockHash = (prevHash: Buffer) => {
        this.prevBlockHash = prevHash
    }

    //  4 byte
    getDifficulty = (): bigint => {
        return this.difficulty
    }
    getDifficultyBuffer = (): Buffer => {
        return toBufferBE(this.difficulty, 4)
    }
    setDifficulty = (difficulty: Buffer) => {
        this.difficulty = toBigIntBE(difficulty)
    }

    // 32 byte
    getMerkleRoot = (): Buffer => {
        return this.merkleRoot
    }
    setMerkleRoot = (merkleRoot: Buffer) => {
        this.merkleRoot = merkleRoot
    }

    // 4 byte
    getNonce = (): bigint => {
        return this.nonce
    }
    getNonceBuffer = (): Buffer => {
        return toBufferBE(this.getNonce(), 4)
    }
    setNonceBuffer = (nonce: Buffer) => {
        this.nonce = toBigIntBE(nonce)
    }
    setNonce = (nonce: bigint) => {
        this.nonce = nonce
    }

    encode = (): Buffer => {
        let bufs: Buffer[] = []

        bufs.push(this.getVersionBuffer())
        bufs.push(this.getHeightBuffer())
        bufs.push(this.prevBlockHash)
        bufs.push(this.getDifficultyBuffer())
        bufs.push(this.merkleRoot)
        bufs.push(this.getNonceBuffer())

        return Buffer.concat(bufs)
    }
    
    hash = (): Buffer => {
        const hashed = createHash('sha256').update(this.encode()).digest()
        return hashed
    }

    static decode = (blob: Buffer): BlockHeader => {
        const versionBuf = blob.slice(0, 4)
        const version = toBigIntBE(versionBuf)

        const heightBuf = blob.slice(4, 8)
        const height = toBigIntBE(heightBuf)

        const prevBlockHash = blob.slice(8, 40)

        const difficultyTargetBuf = blob.slice(40, 44)
        const difficultyTarget = toBigIntBE(difficultyTargetBuf)

        const merkleRoot = blob.slice(44, 76)

        const nonceBuf = blob.slice(76, 80)
        const nonce = toBigIntBE(nonceBuf)

        return new BlockHeader(version, height, prevBlockHash, merkleRoot, nonce, difficultyTarget)
    }
}