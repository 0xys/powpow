import { Destination, Transaction } from './transaction'
import { Wallet } from '../miner/wallet'
import * as bip39 from "bip39"
import hdkey from 'hdkey'

const createWallet = (mnemonic: string, index: number): Wallet => {
    const seed = bip39.mnemonicToSeedSync(mnemonic)
    const root = hdkey.fromMasterSeed(seed)
    const node = root.derive(`m/44'/1234'/0'/${index}`)
    return new Wallet(node.privateKey)
}

const mnemonic = 'thrive cattle beyond fuel mammal section trap forum foam elegant river school'
const wallet0 = createWallet(mnemonic, 0)
const wallet1 = createWallet(mnemonic, 1)

test('simple transaction', () => {
    const from = wallet0.getAddressBuffer()
    const fee = BigInt(1234)
    const destAddress = wallet1.getAddressBuffer()
    const destAmount = BigInt(123456)
    const destMessage = Buffer.from('hello', 'utf8')

    const dests = [new Destination(destAddress, destAmount, destMessage)]
    const tx = new Transaction(from, fee, dests)
    const signature = wallet0.signTransaction(tx)
    tx.setSignature(signature)

    const encoded = tx.encode()

    const decoded = Transaction.decode(encoded)

    expect(decoded.hashString()).toBe(tx.hashString())

    expect(decoded.getFromAddressString()).toBe(tx.getFromAddressString())

    expect(decoded.getFee()).toBe(fee)

    expect(decoded.getDests().length).toBe(1)
    expect(decoded.getDests().length).toBe(tx.getDests().length)

    expect(decoded.getDests()[0].getAddressString()).toBe(destAddress.toString('hex'))
    expect(decoded.getDests()[0].getAmount()).toBe(destAmount)
    expect(decoded.getDests()[0].getMessageUtf8()).toBe('hello')

    expect(decoded.getSignature().toString('hex')).toBe(tx.getSignature().toString('hex'))

})

test('transaction with no message', () => {
    const from = wallet0.getAddressBuffer()
    const fee = BigInt(1234)
    const destAddress = wallet1.getAddressBuffer()
    const destAmount = BigInt(123456)
    const destMessage = Buffer.from('')

    const dests = [new Destination(destAddress, destAmount, destMessage)]
    const tx = new Transaction(from, fee, dests)
    const signature = wallet0.signTransaction(tx)
    tx.setSignature(signature)

    const encoded = tx.encode()

    const decoded = Transaction.decode(encoded)

    expect(decoded.hashString()).toBe(tx.hashString())

    expect(decoded.getFromAddressString()).toBe(tx.getFromAddressString())

    expect(decoded.getFee()).toBe(fee)

    expect(decoded.getDests().length).toBe(1)
    expect(decoded.getDests().length).toBe(tx.getDests().length)

    expect(decoded.getDests()[0].getAddressString()).toBe(destAddress.toString('hex'))
    expect(decoded.getDests()[0].getAmount()).toBe(destAmount)
    expect(decoded.getDests()[0].getMessageUtf8()).toBe('')

    expect(decoded.getSignature().toString('hex')).toBe(tx.getSignature().toString('hex'))

})

test('transaction to multiple dests', () => {
    const from = wallet0.getAddressBuffer()
    const fee = BigInt(1234)

    let dests: Destination[] = []
    const size = 10
    for (let i=0;i<size;i++){
        const w = createWallet(mnemonic, 100 + i)
        const destAddress = w.getAddressBuffer()
        const destAmount = BigInt(10000 + i)
        const destMessage = Buffer.from(`hello ${i}`, 'utf8')
        dests.push(new Destination(destAddress, destAmount, destMessage))
    }
    
    const tx = new Transaction(from, fee, dests)
    const signature = wallet0.signTransaction(tx)
    tx.setSignature(signature)

    const encoded = tx.encode()

    const decoded = Transaction.decode(encoded)

    expect(decoded.hashString()).toBe(tx.hashString())

    expect(decoded.getFromAddressString()).toBe(tx.getFromAddressString())

    expect(decoded.getFee()).toBe(fee)

    expect(decoded.getDests().length).toBe(size)
    expect(decoded.getDests().length).toBe(tx.getDests().length)

    for (let i = 0; i < size; i++) {
        expect(decoded.getDests()[i].getAddressString()).toBe(dests[i].getAddressString())
        expect(decoded.getDests()[i].getAmount()).toBe(dests[i].getAmount())
        expect(decoded.getDests()[i].getMessageUtf8()).toBe(dests[i].getMessageUtf8())
    }

    expect(decoded.getSignature().toString('hex')).toBe(tx.getSignature().toString('hex'))

})

test('transaction to multiple dests with no message for some', () => {
    const from = wallet0.getAddressBuffer()
    const fee = BigInt(1234)

    let dests: Destination[] = []
    const size = 10
    for (let i=0;i<size;i++){
        const w = createWallet(mnemonic, 100 + i)
        const destAddress = w.getAddressBuffer()
        const destAmount = BigInt(10000 + i)
        if (i % 2 == 0) {
            const destMessage = Buffer.from(`hello ${i}`, 'utf8')
            dests.push(new Destination(destAddress, destAmount, destMessage))
        } else {
            dests.push(new Destination(destAddress, destAmount, Buffer.from('')))
        }
    }
    
    const tx = new Transaction(from, fee, dests)
    const signature = wallet0.signTransaction(tx)
    tx.setSignature(signature)

    const encoded = tx.encode()

    const decoded = Transaction.decode(encoded)

    expect(decoded.hashString()).toBe(tx.hashString())

    expect(decoded.getFromAddressString()).toBe(tx.getFromAddressString())

    expect(decoded.getFee()).toBe(fee)

    expect(decoded.getDests().length).toBe(size)
    expect(decoded.getDests().length).toBe(tx.getDests().length)

    for (let i = 0; i < size; i++) {
        expect(decoded.getDests()[i].getAddressString()).toBe(dests[i].getAddressString())
        expect(decoded.getDests()[i].getAmount()).toBe(dests[i].getAmount())
        expect(decoded.getDests()[i].getMessageUtf8()).toBe(dests[i].getMessageUtf8())
    }

    expect(decoded.getSignature().toString('hex')).toBe(tx.getSignature().toString('hex'))

})