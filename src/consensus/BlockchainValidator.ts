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

    validateEntireChain = (): {ok: boolean, message: string} => {
        let balances: {[address: string]: bigint} = {}

        for (const block of this.blocks) {
            if (!this.validator.validate(block)) {
                return { ok: false, message: `validation failed at height ${block.getHeight()}`}
            }

            for (const tx of block.getTransactions()) {
                let miner: string = ''
                if (tx.isCoinbase()) {
                    const dest = tx.getDests()[0]
                    miner = dest.getAddressString()

                    // miner receives mined token
                    balances[miner] += dest.getAmount()
                    continue
                }

                let sum: bigint = BigInt(0)
                for (const dest of tx.getDests()) {
                    sum += dest.getAmount()

                    //  recipient receives sent token
                    balances[dest.getAddressString()] += dest.getAmount()
                }

                //  miner receives fee
                balances[miner] += tx.getFee()

                //  sender sends sum and fee
                const sender = tx.getFromAddressString()
                balances[sender] -= sum + tx.getFee()

                //  sender's balance must be non-negative
                if (balances[sender] < 0) {
                    return { ok: false, message: `tx ${tx.hash()} tried to send too much amount`}
                }
            }
        }

        return { ok: true, message: '' }
    }

}