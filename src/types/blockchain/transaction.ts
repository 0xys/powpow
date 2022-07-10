import { toBigIntBE, toBigIntLE, toBufferBE, toBufferLE } from 'bigint-buffer';
import { createHash } from 'crypto';
import secp256k1 from 'secp256k1'

export const godAddress = Buffer.allocUnsafe(33).fill(0)

export class Transaction {
    from: Buffer
    sequence: bigint
    fee: bigint
    dests: Destination[]
    signature: Buffer

    constructor(
        from: Buffer,
        sequence: bigint,
        fee: bigint,
        dests: Destination[],
        signature: Buffer = Buffer.allocUnsafe(65))
    {
        this.from = from
        this.sequence = sequence
        this.fee = fee
        this.dests = dests
        this.signature = signature
    }

    //  33 byte
    getFromAddress = (): Buffer => {
        return this.from
    }
    getFromAddressString = (): string => {
        return this.from.toString('hex')
    }
    setFromAddress = (from: Buffer) => {
        this.from = from
    }

    //  4 byte
    getSequence = (): bigint => {
        return this.sequence
    }
    getSequenceBuffer = (): Buffer => {
        return toBufferBE(this.sequence, 4)
    }
    setSequence = (seq: Buffer) => {
        this.sequence = toBigIntBE(seq)
    }

    // 8 byte
    getFee = (): bigint => {
        return this.fee
    }
    getFeeBuffer = (): Buffer => {
        return toBufferBE(this.fee, 8)
    }
    setFee = (fee: Buffer) => {
        this.fee = toBigIntBE(fee)
    }

    getDests = (): Destination[] => {
        return this.dests
    }
    setDests = (dests: Destination[]) => {
        this.dests = dests
    }

    // 65 byte
    // with recovery suffix
    getRcSignature = (): Buffer => {
        return this.signature
    }

    // 64 byte
    getSignature = (): Buffer => {
        return this.signature.slice(0, 64)
    }

    setSignature = (signature: Buffer) => {
        this.signature = signature
    }

    toSignable = (): Buffer => {
        let bufs: Buffer[] = []
        bufs.push(this.from)

        bufs.push(this.getSequenceBuffer())

        const feeBuf = toBufferBE(this.fee, 8)
        bufs.push(feeBuf)

        const lenBuf = conv(this.dests.length)
        bufs.push(lenBuf)

        for (const dest of this.dests) {
            bufs.push(dest.encode())
        }

        return Buffer.concat(bufs)
    }

    hash = (): Buffer => {
        const body = this.toSignable()
        const hashed = createHash('sha256').update(body).digest()
        return hashed
    }

    hashString = (): string => {
        return this.hash().toString('hex')
    }

    encode = (): Buffer => {
        let bufs: Buffer[] = []
        bufs.push(this.from)

        bufs.push(this.getSequenceBuffer())

        const feeBuf = toBufferBE(this.fee, 8)
        bufs.push(feeBuf)

        const lenBuf = conv(this.dests.length)
        bufs.push(lenBuf)

        for (const dest of this.dests) {
            bufs.push(dest.encode())
        }

        bufs.push(this.signature)

        return Buffer.concat(bufs)
    }
    encodeToHex = (): string => {
        return this.encode().toString('hex')
    }

    encodedLen = (): number => {
        let destsSize = 0
        for (const dest of this.dests) {
            destsSize += dest.encodedLen()
        }

        // from + seq + fee + destLen + [dests] + signature
        return 33 + 4 + 8 + 4 + destsSize + 65
    }

    static decode = (blob: Buffer): Transaction => {
        const from = blob.slice(0, 33)   // 33 byte

        const seqBuf = blob.slice(33, 37)
        const seq = toBigIntBE(seqBuf)

        const feeBuf = blob.slice(37, 45)
        const fee = toBigIntBE(feeBuf)

        const lenBuf = blob.slice(45, 49) // 4 byte
        const len = Number(toBigIntBE(lenBuf))

        let dests: Destination[] = []
        let offset = 0
        for (let i = 0; i < len; i++) {
            const dest = Destination.decode(blob.slice(49 + offset))
            dests.push(dest)
            offset += dest.encodedLen()
        }

        const signature = blob.slice(49 + offset, 49 + offset + 65) // 65 byte

        return new Transaction(from, seq, fee, dests, signature)
    }

    static Coinbase = (height: bigint, beneficiaryPrivateKey: Buffer, blockReward: bigint): Transaction => {
        const beneficiaryPubkey = secp256k1.publicKeyCreate(beneficiaryPrivateKey, true)

        const dest = new Destination(Buffer.from(beneficiaryPubkey), blockReward, Buffer.from([]))
        
        const unsigned = new Transaction(godAddress, height, BigInt(0), [dest])
        
        const sig = secp256k1.ecdsaSign(unsigned.hash(), beneficiaryPrivateKey)
        const recIdBuf = Buffer.from([sig.recid])
        const signature = Buffer.concat([sig.signature, recIdBuf])

        return new Transaction(godAddress, height, BigInt(0), [dest], signature)
    }

    isCoinbase = (): boolean => {
        return this.getFromAddress().equals(godAddress)
    }
}

export class Destination {
    private message: Buffer
    constructor(private address: Buffer, private amount: bigint, message?: Buffer) {
        if(message) {
            this.message = message
        }else{
            this.message = Buffer.from('')
        }
    }

    getAddress = (): Buffer => {
        return this.address
    }
    getAddressString = (): string => {
        return this.address.toString('hex')
    }

    getAmount = (): bigint => {
        return this.amount
    }
    getAmountBuffer = (): Buffer => {
        return toBufferBE(this.amount, 8)
    }

    getMessage = (): Buffer => {
        return this.message
    }
    getMessageUtf8 = (): string => {
        return this.message.toString('utf8')
    }

    encode = (): Buffer => {
        let amountBuf = toBufferBE(this.amount, 8)
        let messageBuf = this.encodeMessage()
        return Buffer.concat([this.address, amountBuf, messageBuf])
    }

    encodedLen = (): number => {
        return 33 + 8 + 4 + this.message.length
    }

    static decode = (blob: Buffer): Destination => {
        const address = blob.slice(0, 33)   // 33 byte

        const amountBuf = blob.slice(33, 41)    // 8 bytee
        const amount = toBigIntBE(amountBuf)

        const lenBuf = blob.slice(41, 45) // 4 byte
        const len = Number(toBigIntBE(lenBuf))

        const message = blob.slice(45, 45+len)

        return new Destination(address, amount, message)
    }

    private encodeMessage = (): Buffer => {
        const lenBuf = conv(this.message.length)
        return Buffer.concat([lenBuf, this.message])    // 4 + len(message) byte
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