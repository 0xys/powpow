import { Wallet } from '../miner/wallet'
import * as bip39 from "bip39"
import hdkey from 'hdkey'
import { Block } from './block'
import { Destination, Transaction } from './transaction'

const createWallet = (mnemonic: string, index: number): Wallet => {
    const seed = bip39.mnemonicToSeedSync(mnemonic)
    const root = hdkey.fromMasterSeed(seed)
    const node = root.derive(`m/44'/1234'/0'/${index}`)
    return new Wallet(node.privateKey)
}

const mnemonic = 'thrive cattle beyond fuel mammal section trap forum foam elegant river school'
const wallet0 = createWallet(mnemonic, 0)
const wallet1 = createWallet(mnemonic, 1)

test('block with single transaction', () => {
    const version = BigInt(1234)
    const height = BigInt(10001)
    const prevBlockHashBuffer = Buffer.from('00000000000000000008a4832077c24e1573fa226f6884fe69a106c7be6d00ad', 'hex')
    const nonce = BigInt(1111)

    const fee = BigInt(100)
    const destAddress = wallet1.getAddressBuffer()
    const destAmount = BigInt(123456)
    const destMessage = Buffer.from('hello', 'utf8')
    const dests = [new Destination(destAddress, destAmount, destMessage)]
    const tx = new Transaction(wallet0.getAddressBuffer(), fee, dests)

    const block = new Block(version, height, prevBlockHashBuffer, [tx], nonce)

    const encoded = block.encode()

    const decoded = Block.decode(encoded)

    expect(decoded.hashString()).toBe(block.hashString())

    expect(decoded.getVersion()).toBe(version)
    expect(decoded.getHeight()).toBe(height)
    expect(decoded.getPrevBlockHashString()).toBe(prevBlockHashBuffer.toString('hex'))
    expect(decoded.getNonce()).toBe(nonce)
    expect(decoded.getTransactions().length).toBe(1)

    const decodedTx = decoded.getTransactions()[0]
    expect(decodedTx.getFromAddressString()).toBe(wallet0.getAddress())
    expect(decodedTx.getFee()).toBe(fee)
    expect(decodedTx.getDests().length).toBe(1)

    const decodedDest = decodedTx.getDests()[0]
    expect(decodedDest.getAddressString()).toBe(destAddress.toString('hex'))
    expect(decodedDest.getAmount()).toBe(destAmount)
    expect(decodedDest.getMessageUtf8()).toBe(destMessage.toString('utf8'))

    expect(decoded.getDifficultyTargetBuffer().toString('hex')).toBe(block.getDifficultyTargetBuffer().toString('hex'))
})

test('block with multiple transactions', () => {
    const version = BigInt(1234)
    const height = BigInt(10001)
    const prevBlockHashBuffer = Buffer.from('00000000000000000008a4832077c24e1573fa226f6884fe69a106c7be6d00ad', 'hex')
    const nonce = BigInt(1111)

    const fee = BigInt(100)
    const transactions: Transaction[] = []
    const size = 10
    for (let i = 0; i < size; i++) {
        const fromWallet = createWallet(mnemonic, i)

        const destWallet = createWallet(mnemonic, 100 + i)
        const destAddress = destWallet.getAddressBuffer()
        const destAmount = BigInt(123456)
        const destMessage = Buffer.from('hello', 'utf8')
        const dests = [new Destination(destAddress, destAmount, destMessage)]
        const tx = new Transaction(fromWallet.getAddressBuffer(), fee, dests)
        transactions.push(tx)
    }

    const block = new Block(version, height, prevBlockHashBuffer, transactions, nonce)

    const encoded = block.encode()

    const decoded = Block.decode(encoded)

    expect(decoded.hashString()).toBe(block.hashString())

    expect(decoded.getVersion()).toBe(version)
    expect(decoded.getHeight()).toBe(height)
    expect(decoded.getPrevBlockHashString()).toBe(prevBlockHashBuffer.toString('hex'))
    expect(decoded.getNonce()).toBe(nonce)
    expect(decoded.getTransactions().length).toBe(size)

    for (let i = 0; i < size; i++) {
        const decodedTx = decoded.getTransactions()[i]

        const fromWallet = createWallet(mnemonic, i)
        expect(decodedTx.getFromAddressString()).toBe(fromWallet.getAddress())
        expect(decodedTx.getFee()).toBe(fee)
        expect(decodedTx.getDests().length).toBe(1)

        const decodedDest = decodedTx.getDests()[0]
        const destWallet = createWallet(mnemonic, 100 + i)
        expect(decodedDest.getAddressString()).toBe(destWallet.getAddress())
        expect(decodedDest.getAmount()).toBe(BigInt(123456))
        expect(decodedDest.getMessageUtf8()).toBe(Buffer.from('hello', 'utf8').toString('utf8'))
    }

    expect(decoded.getDifficultyTargetBuffer().toString('hex')).toBe(block.getDifficultyTargetBuffer().toString('hex'))
})