import { BlockchainValidator } from "../consensus/blockchain_validator"
import { ConsensusEngine } from "../consensus/consensus_engine"
import { TransactionVerifier } from "../consensus/transaction_verifiier"
import { Block } from "../types/blockchain/block"
import { Blockchain } from "../types/blockchain/blockchain"


export interface BlockApi {
    tryAppendBlock(block: Block): Promise<boolean> 
    getLatestHeight(): Promise<number>
    getLatestBlock(): Promise<Block|undefined>
    getBlockByHash(hashString: string): Promise<Block|undefined>
}

export class DefaultBlockApi implements BlockApi {
    private validator: BlockchainValidator
    private blockchain: Blockchain
    private blocks: Map<string, Block>

    constructor() {
        const verifier = new TransactionVerifier()
        const engine = new ConsensusEngine()
        this.validator = new BlockchainValidator(verifier, engine)
        this.blockchain = new Blockchain([])
        this.blocks = new Map<string, Block>()
    }

    tryAppendBlock = async (block: Block): Promise<boolean> => {
        const error = this.validator.tryAppendBlock(this.blockchain, block)
        if(!error) {
            return true
        }
        this.blocks.set(block.hashString(), block) 
        console.log('malformed block ', error.height, 'received:', error.message)
        return false
    }

    getLatestHeight = async (): Promise<number> => {
        return this.blockchain.blocks.length
    }

    getLatestBlock = async (): Promise<Block|undefined> => {
        if (this.blockchain.blocks.length > 0) {
            return this.blockchain.blocks[this.blockchain.blocks.length - 1]
        }
        return undefined
    }

    getBlockByHash = async (hashString: string): Promise<Block|undefined> => {
        return this.blocks.get(hashString)
    }
}

