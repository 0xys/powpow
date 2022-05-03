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
    isSizeOk(block: Block): boolean {
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

const dealer0  = createWallet(mnemonic, 100)
const dealer1  = createWallet(mnemonic, 101)
const dealer2  = createWallet(mnemonic, 102)

const wallet0 = createWallet(mnemonic, 0)
const wallet1 = createWallet(mnemonic, 1)
const wallet2 = createWallet(mnemonic, 2)

const verifier = new MockTxVerifier()
const engine = new MockEngine()

const createTx = (from: Wallet, to: Buffer, amount: bigint, fee: bigint = BigInt(10)): Transaction => {
    const tx = new Transaction(from.getAddressBuffer(), BigInt(0), fee, [new Destination(to, amount)])
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

    const coinbase = Transaction.Coinbase(BigInt(0), dealer0.getPrivateKey(), BigInt(10000))
    const tx0 = createTx(dealer0, wallet0.getAddressBuffer(), BigInt(100))
    const tx1 = createTx(dealer0, wallet1.getAddressBuffer(), BigInt(100))
    const tx2 = createTx(dealer0, wallet2.getAddressBuffer(), BigInt(200))

    const block = createBlock(coinbase, [tx0, tx1, tx2], BigInt(0), Buffer.allocUnsafe(32).fill(0))

    blockchain.blocks.push(block)

    const error = validator.validateEntireChainFromZero(blockchain)
    expect(error).toBe(undefined)
    expect(validator.cache.getValidatedLength()).toBe(1)

    expect(Number(validator.cache.getBalance(dealer0.getAddress()))).toBe(9600)
    expect(Number(validator.cache.getBalance(wallet0.getAddress()))).toBe(100)
    expect(Number(validator.cache.getBalance(wallet1.getAddress()))).toBe(100)
    expect(Number(validator.cache.getBalance(wallet2.getAddress()))).toBe(200)
})

test('single block validation 2', () => {
    const validator = new BlockchainValidator(verifier, engine)

    const blockchain = new Blockchain()

    let hash0: Buffer
    {
        const coinbase = Transaction.Coinbase(BigInt(0), dealer0.getPrivateKey(), BigInt(10000))
        const tx0 = createTx(dealer0, wallet0.getAddressBuffer(), BigInt(100))
        const tx1 = createTx(dealer0, wallet1.getAddressBuffer(), BigInt(100))
        const tx2 = createTx(wallet1, wallet2.getAddressBuffer(), BigInt(10))
        const block = createBlock(coinbase, [tx0, tx1, tx2], BigInt(0), Buffer.allocUnsafe(32).fill(0))
        blockchain.blocks.push(block)
        hash0 = block.hash()
    }

    const error = validator.validateEntireChainFromZero(blockchain)
    expect(error).toBe(undefined)
    expect(validator.cache.getValidatedLength()).toBe(1)

    expect(Number(validator.cache.getBalance(dealer0.getAddress()))).toBe(9810)

    expect(Number(validator.cache.getBalance(wallet0.getAddress()))).toBe(100)
    expect(Number(validator.cache.getBalance(wallet1.getAddress()))).toBe(80)
    expect(Number(validator.cache.getBalance(wallet2.getAddress()))).toBe(10)
})

test('two blocks validation', () => {
    const validator = new BlockchainValidator(verifier, engine)

    const blockchain = new Blockchain()

    let hash0: Buffer
    {
        const coinbase = Transaction.Coinbase(BigInt(0), dealer0.getPrivateKey(), BigInt(10000))
        const tx0 = createTx(dealer0, wallet0.getAddressBuffer(), BigInt(100))
        const tx1 = createTx(dealer0, wallet1.getAddressBuffer(), BigInt(100))
        const tx2 = createTx(dealer0, wallet2.getAddressBuffer(), BigInt(200))
        const block = createBlock(coinbase, [tx0, tx1, tx2], BigInt(0), Buffer.allocUnsafe(32).fill(0))
        blockchain.blocks.push(block)
        hash0 = block.hash()
    }
    
    {
        const coinbase = Transaction.Coinbase(BigInt(1), dealer1.getPrivateKey(), BigInt(10000))
        const tx0 = createTx(dealer1, wallet0.getAddressBuffer(), BigInt(1000))
        const tx1 = createTx(dealer1, wallet1.getAddressBuffer(), BigInt(1000))
        const tx2 = createTx(dealer1, wallet2.getAddressBuffer(), BigInt(2000))
        const block = createBlock(coinbase, [tx0, tx1, tx2], BigInt(1), hash0)
        blockchain.blocks.push(block)
    }

    const error = validator.validateEntireChainFromZero(blockchain)
    expect(error).toBe(undefined)
    expect(validator.cache.getValidatedLength()).toBe(2)

    expect(Number(validator.cache.getBalance(dealer0.getAddress()))).toBe(9600)
    expect(Number(validator.cache.getBalance(dealer1.getAddress()))).toBe(6000)

    expect(Number(validator.cache.getBalance(wallet0.getAddress()))).toBe(1100)
    expect(Number(validator.cache.getBalance(wallet1.getAddress()))).toBe(1100)
    expect(Number(validator.cache.getBalance(wallet2.getAddress()))).toBe(2200)
})

test('two blocks validation 2', () => {
    const validator = new BlockchainValidator(verifier, engine)

    const blockchain = new Blockchain()

    let hash0: Buffer
    {
        const coinbase = Transaction.Coinbase(BigInt(0), dealer0.getPrivateKey(), BigInt(10000))
        const tx0 = createTx(dealer0, wallet0.getAddressBuffer(), BigInt(100))
        const tx1 = createTx(dealer0, wallet1.getAddressBuffer(), BigInt(100))
        const tx2 = createTx(wallet1, wallet2.getAddressBuffer(), BigInt(10))
        const block = createBlock(coinbase, [tx0, tx1, tx2], BigInt(0), Buffer.allocUnsafe(32).fill(0))
        blockchain.blocks.push(block)
        hash0 = block.hash()
    }
    
    {
        const coinbase = Transaction.Coinbase(BigInt(1), dealer1.getPrivateKey(), BigInt(10000))
        const tx0 = createTx(dealer1, wallet0.getAddressBuffer(), BigInt(1000))
        const tx1 = createTx(wallet0, wallet1.getAddressBuffer(), BigInt(90))
        const tx2 = createTx(wallet1, wallet2.getAddressBuffer(), BigInt(160))
        const block = createBlock(coinbase, [tx0, tx1, tx2], BigInt(1), hash0)
        blockchain.blocks.push(block)
    }

    const error = validator.validateEntireChainFromZero(blockchain)
    expect(error).toBe(undefined)
    expect(validator.cache.getValidatedLength()).toBe(2)

    expect(Number(validator.cache.getBalance(dealer0.getAddress()))).toBe(9810)
    expect(Number(validator.cache.getBalance(dealer1.getAddress()))).toBe(9020)

    expect(Number(validator.cache.getBalance(wallet0.getAddress()))).toBe(1000)
    expect(Number(validator.cache.getBalance(wallet1.getAddress()))).toBe(0)
    expect(Number(validator.cache.getBalance(wallet2.getAddress()))).toBe(170)
})

test('two blocks out of order', () => {
    const validator = new BlockchainValidator(verifier, engine)

    const blockchain = new Blockchain()

    let hash0: Buffer
    {
        const coinbase = Transaction.Coinbase(BigInt(0), dealer0.getPrivateKey(), BigInt(10000))
        const block = createBlock(coinbase, [], BigInt(0), Buffer.allocUnsafe(32).fill(0))
        blockchain.blocks.push(block)
        hash0 = block.hash()
    }
    
    {
        const coinbase = Transaction.Coinbase(BigInt(2), dealer1.getPrivateKey(), BigInt(10000))
        const block = createBlock(coinbase, [], BigInt(2), hash0)   // out of order
        blockchain.blocks.push(block)
    }

    const error = validator.validateEntireChainFromZero(blockchain)
    expect(error?.message).toBe('block height out of order')
    expect(validator.cache.getValidatedLength()).toBe(1)   // only first block is validated
})

test('wrong previous hash', () => {
    const validator = new BlockchainValidator(verifier, engine)

    const blockchain = new Blockchain()

    {
        const coinbase = Transaction.Coinbase(BigInt(0), dealer0.getPrivateKey(), BigInt(10000))
        const block = createBlock(coinbase, [], BigInt(0), Buffer.allocUnsafe(32).fill(0))
        blockchain.blocks.push(block)
    }
    
    {
        const coinbase = Transaction.Coinbase(BigInt(1), dealer1.getPrivateKey(), BigInt(10000))
        const block = createBlock(coinbase, [], BigInt(1), Buffer.allocUnsafe(32).fill(0))   // wrong prev hash
        blockchain.blocks.push(block)
    }

    const error = validator.validateEntireChainFromZero(blockchain)
    expect(error?.message).toBe('previous block hash not correct')
    expect(validator.cache.getValidatedLength()).toBe(1)   // only first block is validated
})

test('test appending correct block', () => {
    const validator = new BlockchainValidator(verifier, engine)

    const blockchain = new Blockchain()

    // first block
    let hash0: Buffer
    {
        const coinbase = Transaction.Coinbase(BigInt(0), dealer0.getPrivateKey(), BigInt(10000))
        const tx0 = createTx(dealer0, wallet0.getAddressBuffer(), BigInt(100))
        const tx1 = createTx(dealer0, wallet1.getAddressBuffer(), BigInt(100))
        const tx2 = createTx(wallet1, wallet2.getAddressBuffer(), BigInt(10))
        const block = createBlock(coinbase, [tx0, tx1, tx2], BigInt(0), Buffer.allocUnsafe(32).fill(0))
        blockchain.blocks.push(block)
        hash0 = block.hash()
    }

    const error0 = validator.validateEntireChainFromZero(blockchain)
    expect(error0).toBe(undefined)
    expect(validator.cache.getValidatedLength()).toBe(1)

    //  second block
    const coinbase = Transaction.Coinbase(BigInt(1), dealer1.getPrivateKey(), BigInt(10000))
    const tx0 = createTx(dealer1, wallet0.getAddressBuffer(), BigInt(1000))
    const tx1 = createTx(wallet0, wallet1.getAddressBuffer(), BigInt(90))
    const tx2 = createTx(wallet1, wallet2.getAddressBuffer(), BigInt(160))
    const block = createBlock(coinbase, [tx0, tx1, tx2], BigInt(1), hash0)

    const error1 = validator.tryAppendBlock(blockchain, block)
    expect(error1).toBe(undefined)
    expect(validator.cache.getValidatedLength()).toBe(2)

    expect(blockchain.blocks.length).toBe(2)    // check if appended
    expect(blockchain.blocks[1].hashString()).toBe(block.hashString())  // and it's correct

    expect(Number(validator.cache.getBalance(dealer0.getAddress()))).toBe(9810)
    expect(Number(validator.cache.getBalance(dealer1.getAddress()))).toBe(9020)

    expect(Number(validator.cache.getBalance(wallet0.getAddress()))).toBe(1000)
    expect(Number(validator.cache.getBalance(wallet1.getAddress()))).toBe(0)
    expect(Number(validator.cache.getBalance(wallet2.getAddress()))).toBe(170)
})

test('test appending wrong block', () => {
    const validator = new BlockchainValidator(verifier, engine)

    const blockchain = new Blockchain()

    // first block
    let hash0: Buffer
    {
        const coinbase = Transaction.Coinbase(BigInt(0), dealer0.getPrivateKey(), BigInt(10000))
        const tx0 = createTx(dealer0, wallet0.getAddressBuffer(), BigInt(100))
        const tx1 = createTx(dealer0, wallet1.getAddressBuffer(), BigInt(100))
        const tx2 = createTx(wallet1, wallet2.getAddressBuffer(), BigInt(10))
        const block = createBlock(coinbase, [tx0, tx1, tx2], BigInt(0), Buffer.allocUnsafe(32).fill(0))
        blockchain.blocks.push(block)
        hash0 = block.hash()
    }

    const error0 = validator.validateEntireChainFromZero(blockchain)
    expect(error0).toBe(undefined)

    //  second block
    const coinbase = Transaction.Coinbase(BigInt(1), dealer1.getPrivateKey(), BigInt(10000))
    const tx0 = createTx(dealer1, wallet0.getAddressBuffer(), BigInt(1000))
    const tx1 = createTx(wallet0, wallet1.getAddressBuffer(), BigInt(90))
    const tx2 = createTx(wallet1, wallet2.getAddressBuffer(), BigInt(161))   // overspend
    const block = createBlock(coinbase, [tx0, tx1, tx2], BigInt(1), hash0)

    const error1 = validator.tryAppendBlock(blockchain, block)
    expect(error1?.height).toBe(1)      // height 1
    expect(error1?.transactionIndex).toBe(3)    // overspent tx index is 3
    expect(blockchain.blocks.length).toBe(1)    // check if not appended
    expect(validator.cache.getValidatedLength()).toBe(1)    // second block is not validated

    //  balance is of at height 0 
    expect(Number(validator.cache.getBalance(dealer0.getAddress()))).toBe(9810)
    expect(Number(validator.cache.getBalance(wallet0.getAddress()))).toBe(100)
    expect(Number(validator.cache.getBalance(wallet1.getAddress()))).toBe(80)
    expect(Number(validator.cache.getBalance(wallet2.getAddress()))).toBe(10)
})

test('test validate longer blockchain than current one', () => {
    const validator = new BlockchainValidator(verifier, engine)

    const blockchain = new Blockchain()

    // first block
    let hash0: Buffer
    {
        const coinbase = Transaction.Coinbase(BigInt(0), dealer0.getPrivateKey(), BigInt(10000))
        const tx0 = createTx(dealer0, wallet0.getAddressBuffer(), BigInt(100))
        const tx1 = createTx(dealer0, wallet1.getAddressBuffer(), BigInt(100))
        const tx2 = createTx(wallet1, wallet2.getAddressBuffer(), BigInt(10))
        const block = createBlock(coinbase, [tx0, tx1, tx2], BigInt(0), Buffer.allocUnsafe(32).fill(0))
        blockchain.blocks.push(block)
        hash0 = block.hash()
    }

    //  validate with one block
    const error0 = validator.validateEntireChainFromZero(blockchain)
    expect(error0).toBe(undefined)
    expect(validator.cache.getValidatedLength()).toBe(1)

    //  second block
    let hash1: Buffer
    {
        const coinbase = Transaction.Coinbase(BigInt(1), dealer1.getPrivateKey(), BigInt(10000))
        const tx0 = createTx(dealer1, wallet0.getAddressBuffer(), BigInt(1000))
        const tx1 = createTx(wallet0, wallet1.getAddressBuffer(), BigInt(90))
        const tx2 = createTx(wallet1, wallet2.getAddressBuffer(), BigInt(160))
        const block = createBlock(coinbase, [tx0, tx1, tx2], BigInt(1), hash0)
        blockchain.blocks.push(block)
        hash1 = block.hash()
    }
    
    // validate with new blockchain that contains second block
    const error1 = validator.validateMissingChain(blockchain)
    expect(error1).toBe(undefined)

    expect(blockchain.blocks.length).toBe(2)    // check if appended
    expect(blockchain.blocks[1].hashString()).toBe(hash1.toString('hex'))  // and it's correct
    expect(validator.cache.getValidatedLength()).toBe(2)

    expect(Number(validator.cache.getBalance(dealer0.getAddress()))).toBe(9810)
    expect(Number(validator.cache.getBalance(dealer1.getAddress()))).toBe(9020)

    expect(Number(validator.cache.getBalance(wallet0.getAddress()))).toBe(1000)
    expect(Number(validator.cache.getBalance(wallet1.getAddress()))).toBe(0)
    expect(Number(validator.cache.getBalance(wallet2.getAddress()))).toBe(170)
})