import { godAddress, Transaction } from "../types/transaction";
import secp256k1 from 'secp256k1'

export class TransactionVerifier {
    verifySignature = (transaction: Transaction): boolean => {
        const body = transaction.hash()
        const signature = transaction.getSignature()

        //  for coinbase transaction
        if (this.isCoinbase(transaction)) {
            if (transaction.getDests().length != 1) {
                return false    // dests must be of length = 1
            }
            const beneficiary = transaction.getDests()[0]
            return secp256k1.ecdsaVerify(signature, body, beneficiary.getAddress())
        }

        return secp256k1.ecdsaVerify(signature, body, transaction.getFromAddress())
    }

    verifyConsensus = (transaction: Transaction): boolean => {
        return false
    }

    private isCoinbase = (transaction: Transaction): boolean => {
        return transaction.getFromAddress() == godAddress
    }
}