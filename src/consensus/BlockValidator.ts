import { Block } from "../types/block";
import { TransactionVerifier } from "./TransactionVerifier";

export class BlockValidator {

    constructor(private verifier: TransactionVerifier) {

    }

    validate = (block: Block): boolean => {
        for (const tx of block.getTransactions()) {
            if (!this.verifier.verifySignature(tx)) {
                return false
            }

            if (!this.verifier.verifyConsensus(tx)) {
                return false
            }
        }

        return true
    }
}