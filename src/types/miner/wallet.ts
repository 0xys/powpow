import secp256k1 from 'secp256k1'
import { Transaction } from '../blockchain/transaction'

export class Wallet {
    constructor(private privateKey: Buffer){

    }

    getAddressBuffer = (): Buffer => {
        return Buffer.from(secp256k1.publicKeyCreate(this.privateKey, true))
    }
    getAddress = (): string => {
        return this.getAddressBuffer().toString('hex')
    }

    signTransaction = (transaction: Transaction): Buffer => {
        const signedData = transaction.hash()
        return this.sign(signedData)
    }

    sign = (buf: Buffer): Buffer => {
        const sig = secp256k1.ecdsaSign(buf, this.privateKey)
        const recIdBuf = Buffer.from([sig.recid])
        const signature = Buffer.concat([sig.signature, recIdBuf])
        return signature
    }
}