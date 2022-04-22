import { Block } from "../types/block";
import { BlockValidator } from "./BlockValidator";

export class BlockchainValidator {
    private blocks: Block[]
    
    constructor(private validator: BlockValidator) {
        this.blocks = []
    }

    appendBlock = (block: Block) => {
        this.blocks.push(block)
    }

    validateChain = (): {ok: boolean, message: string} => {
        let balances: {[address: string]: bigint} = {}

        for (const block of this.blocks) {
            if (!this.validator.validate(block)) {
                return { ok: false, message: `validation failed at height ${block.getHeight()}`}
            }

            for (const tx of block.getTransactions()) {
                if (tx.isCoinbase()) {
                    const dest = tx.getDests()[0]
                    balances[dest.getAddressString()] += dest.getAmount()
                    continue
                }

                let sum: bigint = BigInt(0)
                for (const dest of tx.getDests()) {
                    sum += dest.getAmount()
                    balances[dest.getAddressString()] += dest.getAmount()
                }

                if (balances[tx.getFromAddressString()] < sum) {
                    return { ok: false, message: `tx ${tx.hash()} tried to send too much amount`}
                }
            }
        }

        return { ok: true, message: '' }
    }

}