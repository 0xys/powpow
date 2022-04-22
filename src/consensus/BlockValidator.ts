import { Block } from "../types/block";
import { TransactionVerifier } from "./TransactionVerifier";

export class BlockValidator {

    constructor(private verifier: TransactionVerifier) {

    }

    validate = (block: Block): boolean => {
        let coinbaseCount = 0
        for (let i = 0; i < block.getTransactions().length; i++) {
            const tx = block.getTransactions()[i]

            if (tx.isCoinbase()) {
                if (i != 0) {
                    // coinbase must be at the top of the block
                    return false
                }
                coinbaseCount += 1
            }

            if (!this.verifier.verifySignature(tx)) {
                return false
            }

            if (!this.verifier.verifyConsensus(tx)) {
                return false
            }
        }

        //  only one coinbase is allowed
        if (coinbaseCount != 1) {
            return false
        }

        return true
    }
}