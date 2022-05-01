import { Block } from "../types/blockchain/block";
import { Blockchain } from "../types/blockchain/blockchain";
import { ConsensusEngineInterface } from "./consensus_engine"
import { TransactionVerifierInterface } from "./transaction_verifiier";

class Journal {
    address: string
    amount: bigint
    positive: boolean
    constructor(address: string, amount: bigint, positive: boolean) {
        if (amount < 0) {
            throw new Error('Journal amount must be non-negative')
        }
        this.address = address
        this.amount = amount
        this.positive = positive
    }
}

class BalanceMapCache {
    private balances: {[address: string]: bigint} = {}
    private journals: Journal[]

    constructor(private validatedLength: number) {
        this.balances = {}
        this.journals = []
    }

    static Empty = (): BalanceMapCache => {
        return new BalanceMapCache(0)
    }

    getValidatedLength = (): number => {
        return this.validatedLength
    }
    setValidatedLength = (upto: number) => {
        this.validatedLength = upto
    }

    getBalance = (address: string): bigint => {
        return this.balances[address]
    }
    addBalance = (address: string, amount: bigint) => {
        if (!this.balances[address]) {
            this.balances[address] = BigInt(0)
        }
        this.balances[address] += amount
        this.journals.push(new Journal(address, amount, true))
    }
    subtractBalance = (address: string, amount: bigint) => {
        if (!this.balances[address]) {
            this.balances[address] = BigInt(0)
        }
        this.balances[address] -= amount
        this.journals.push(new Journal(address, amount, false))
    }

    takeSnapshot = (): number => {
        return this.journals.length
    }

    revert = (snapshot: number) => {
        const len = this.journals.length
        for (let i = len - 1; i >= snapshot; i--) {
            const journal = this.journals[i]
            if (journal.positive) {
                this.balances[journal.address] -= journal.amount
            }else{
                this.balances[journal.address] += journal.amount
            }
            this.journals.pop()
        }
    }
}

export class ChainValidationError {
    height: number = 0
    transactionIndex: number = 0
    transactionHash: string = Buffer.allocUnsafe(32).fill(0).toString('hex')
    message: string = ''

    constructor(height: number, transactionIndex: number, transactionHash: string, message: string){
        this.height = height
        this.transactionIndex = transactionIndex
        this.transactionHash = transactionHash
        this.message = message
    }
}

export class BlockchainValidator {
    cache: BalanceMapCache = BalanceMapCache.Empty()

    constructor(
        private verifier: TransactionVerifierInterface,
        private consensusEngine: ConsensusEngineInterface
    ) {

    }

    tryAppendBlock = (blockchain: Blockchain, block: Block): ChainValidationError|undefined => {
        //  if balance map not in sync with given blockchain
        if (blockchain.blocks.length > this.cache.getValidatedLength()) {
            const error = this.validateMissingChain(blockchain)
            if (error) {
                return error
            }
        }

        const blockError = this.validateBlockConsensus(block)
        if (blockError) {
            //  block error doesn't set transaction index
            return new ChainValidationError(blockchain.blocks.length, -1, '', blockError)
        }

        const snapshot = this.cache.takeSnapshot()
        const error = this.validateBlockTransactions(block)
        if (error) {
            this.cache.revert(snapshot)
            const hashString = block.getTransactions()[error.index].hashString()
            return new ChainValidationError(blockchain.blocks.length, error.index, hashString, error.message)
        }

        blockchain.blocks.push(block)
        this.cache.setValidatedLength(blockchain.blocks.length)
    }

    validateMissingChain = (blockchain: Blockchain): ChainValidationError|undefined => {
        for (let height = this.cache.getValidatedLength(); height < blockchain.blocks.length; height++) {
            const block = blockchain.blocks[height]

            if (height > 0) {
                const prevBlock = blockchain.blocks[height - 1]
                if (!block.getPrevBlockHash().equals(prevBlock.hash())) {
                    return new ChainValidationError(height, -1, '', 'previous block hash not correct') 
                }
                if(prevBlock.getHeight() + BigInt(1) != block.getHeight()) {
                    return new ChainValidationError(height, -1, '', 'block height out of order') 
                }
            }

            const blockError = this.validateBlockConsensus(block)
            if (blockError) {
                //  block error doesn't set transaction index
                return new ChainValidationError(height, -1, '', blockError)
            }

            const snapshot = this.cache.takeSnapshot()
            const error = this.validateBlockTransactions(block)
            if (error) {
                this.cache.revert(snapshot)
                const hashString = block.getTransactions()[error.index].hashString()
                return new ChainValidationError(height, error.index, hashString, error.message)
            }
            this.cache.setValidatedLength(height + 1)
        }
    }

    validateEntireChainFromZero = (blockchain: Blockchain): ChainValidationError|undefined => {
        this.cache = BalanceMapCache.Empty()
        return this.validateMissingChain(blockchain)
    }

    getConsensusEngine = (): ConsensusEngineInterface => {
        return this.consensusEngine
    }

    private validateBlockTransactions = (block: Block): {index: number, message: string}|undefined => {
        let miner: string = ''
        for (let i = 0; i < block.getTransactions().length; i++) {
            const tx = block.getTransactions()[i]

            if (!this.verifier.verifySignature(tx)) {
                return { index: i, message: 'invalid signature' }
            }

            if (!this.verifier.verifyConsensus(tx)) {
                return { index: i, message: 'consensus rule violated' }
            }

            if (tx.isCoinbase()) {
                const dest = tx.getDests()[0]
                miner = dest.getAddressString()

                // miner receives mined token
                this.cache.addBalance(miner, dest.getAmount())
                continue
            }

            let sum: bigint = BigInt(0)
            for (const dest of tx.getDests()) {
                sum += dest.getAmount()

                //  recipient receives sent token
                this.cache.addBalance(dest.getAddressString(), dest.getAmount())
            }

            //  miner receives fee
            this.cache.addBalance(miner, tx.getFee())

            //  sender sends sum and fee
            const sender = tx.getFromAddressString()
            this.cache.subtractBalance(sender, sum + tx.getFee())

            //  sender's balance must be non-negative
            if (this.cache.getBalance(sender) < 0) {
                return { index: i, message: 'sender tried to send too much amount' }
            }
        }
    }

    private validateBlockConsensus = (block: Block): string|undefined => {
        if (!this.consensusEngine.isSolved(block)) {
            return `invalid difficulty`;
        }

        if (!this.consensusEngine.isSizeOk(block)) {
            return `exceed size limit`
        }

        let coinbaseCount = 0
        for (let i = 0; i < block.getTransactions().length; i++) {
            const tx = block.getTransactions()[i]

            if (tx.isCoinbase()) {
                if (i != 0) {
                    // coinbase must be at the top of the block
                    return `coinbase transaction not at the top`
                }
                coinbaseCount += 1
            }
        }

        //  only one coinbase is allowed
        if (coinbaseCount != 1) {
            return `only one coinbase transaction is allowed`
        }
    }
}