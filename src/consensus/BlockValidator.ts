import { Block } from "../types/block";
import { TransactionVerifier } from "./TransactionVerifier";

export class BlockValidator {

    constructor(private verifier: TransactionVerifier) {

    }

    validate = (block: Block): boolean => {
        let coinbaseCount = 0
        for (const tx of block.getTransactions()) {
            if (tx.isCoinbase()) {
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