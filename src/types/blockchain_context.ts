import { BlockchainValidator } from "../consensus/blockchain_validator";
import { ConsensusEngine, ConsensusEngineInterface } from "../consensus/consensus_engine";
import { Block } from "./blockchain/block";
import { Blockchain } from "./blockchain/blockchain";
import { Transaction } from "./blockchain/transaction";
import { BlockFactory } from "./block_factory";
import { Miner } from "./miner/miner";

export class BlockchainContext {
    private blockchain: Blockchain
    constructor(private validator: BlockchainValidator) {
        this.blockchain = new Blockchain([])
    }

    getBalance = (addressString: string): bigint => {
        return this.validator.cache.getBalance(addressString)
    }

    tryAppendBlock = (block: Block): boolean => {
        const error = this.validator.tryAppendBlock(this.blockchain, block)
        if (error) {
            console.log(error)
            return false
        }else{
            return true
        }
    }

    appendBlockUnsafe = (block: Block) => {
        this.blockchain.blocks = [...this.blockchain.blocks, block]
    }

    getBlockchain = (): Blockchain => {
        return this.blockchain
    }

    getConsensusEngine = (): ConsensusEngineInterface => {
        return this.validator.getConsensusEngine()
    }
}