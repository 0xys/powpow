import { Block } from '../types/blockchain/block'
import { Destination, Transaction } from '../types/blockchain/transaction'
import { BlockchainValidator } from './blockchain_validator'
import { ConsensusEngineInterface } from './consensus_engine'
import { TransactionVerifierInterface } from './transaction_verifiier'
import * as bip39 from "bip39"
import hdkey from 'hdkey'
import { Wallet } from '../types/miner/wallet'
import { Blockchain } from '../types/blockchain/blockchain'

class MockTxVerifier implements TransactionVerifierInterface {
    verifySignature(transaction: Transaction): boolean {
        return true
    }
    verifyConsensus(transaction: Transaction): boolean {
        return true
    }
}

class MockEngine implements ConsensusEngineInterface {
    isSolved(block: Block): boolean {
        return true
    }    
}

const mnemonic = 'thrive cattle beyond fuel mammal section trap forum foam elegant river school'
const createWallet = (mnemonic: string, index: number): Wallet => {
    const seed = bip39.mnemonicToSeedSync(mnemonic)
    const root = hdkey.fromMasterSeed(seed)
    const node = root.derive(`m/44'/1234'/0'/${index}`)
    return new Wallet(node.privateKey)
}

const dealer  = createWallet(mnemonic, 0)
const wallet0 = createWallet(mnemonic, 1)
const wallet1 = createWallet(mnemonic, 2)
const wallet2 = createWallet(mnemonic, 3)

const verifier = new MockTxVerifier()
const engine = new MockEngine()

const createTx = (from: Wallet, to: Buffer, amount: bigint, fee: bigint = BigInt(10)): Transaction => {
    const tx = new Transaction(from.getAddressBuffer(), fee, [new Destination(to, amount)])
    tx.setSignature(Buffer.allocUnsafe(65))
    return tx
}
const createBlock = (coinbase: Transaction, txs: Transaction[], height: bigint, prevBlockHash: Buffer): Block => {
    const block = new Block(BigInt(1), height, prevBlockHash, [coinbase, ...txs], BigInt(0))
    return block
}

test('single block validation', () => {
    const validator = new BlockchainValidator(verifier, engine)

    const blockchain = new Blockchain()

    const coinbase = Transaction.Coinbase(dealer.getPrivateKey(), BigInt(10000))
    const tx0 = createTx(dealer, wallet0.getAddressBuffer(), BigInt(100))
    const tx1 = createTx(dealer, wallet1.getAddressBuffer(), BigInt(100))
    const tx2 = createTx(dealer, wallet2.getAddressBuffer(), BigInt(200))

    const block = createBlock(coinbase, [tx0, tx1, tx2], BigInt(0), Buffer.allocUnsafe(32).fill(0))

    blockchain.blocks.push(block)

    const error = validator.validateEntireChainFromZero(blockchain)
    expect(error).toBe(undefined)

    expect(Number(validator.cache.getBalance(dealer.getAddress()))).toBe(9600)
    expect(Number(validator.cache.getBalance(wallet0.getAddress()))).toBe(100)
    expect(Number(validator.cache.getBalance(wallet1.getAddress()))).toBe(100)
    expect(Number(validator.cache.getBalance(wallet2.getAddress()))).toBe(200)
})