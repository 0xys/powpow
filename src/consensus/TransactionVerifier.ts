import { godAddress, Transaction } from "../types/transaction";
import secp256k1 from 'secp256k1'

export class TransactionVerifier {
    verifySignature = (transaction: Transaction): boolean => {
        const body = transaction.hash()
        const signature = transaction.getSignature()

        //  for coinbase transaction
        if (transaction.isCoinbase()) {
            if (transaction.getDests().length != 1) {
                return false    // dests must be of length = 1
            }

            //  coinbase transaction must not pay fee
            if (transaction.getFee() != BigInt(0)) {
                return false
            }

            const beneficiary = transaction.getDests()[0]
            
            //  coinbase transaction is signed by first dest
            return secp256k1.ecdsaVerify(signature, body, beneficiary.getAddress())
        }

        //  token must be sent to someone
        if (transaction.getDests().length == 0) {
            return false
        }

        return secp256k1.ecdsaVerify(signature, body, transaction.getFromAddress())
    }

    verifyConsensus = (transaction: Transaction): boolean => {
        return false
    }
}