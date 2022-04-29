import type { NextPage } from 'next'
import { useState } from 'react'
import { Destination, Transaction } from '../../types/blockchain/transaction'
import { Miner } from '../../types/miner/miner'
import { Wallet } from '../../types/miner/wallet'

type OnSendHandler = (txBlob: string) => void

export const WalletComponent = (prop: {onSend: OnSendHandler}) => {
    const {onSend} = prop
    const [mnemonic, setMnemonic] = useState<string>('')
    const [miner, setMiner] = useState<Miner>()
    const [selectedWallet, setSelectedWallet] = useState<Wallet>()
    const [destinationAddress, setDestinationAddress] = useState<string>('')
    const [destinationAmountString, setDestinationAmountString] = useState<string>('')
    const [destinationAmount, setDestinationAmount] = useState<bigint>(BigInt(0))
    const [destinationMessage, setDestinationMessage] = useState<string>('')

    const onMnemonicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMnemonic(e.target.value)
    }
    const onImport = (e: any) => {
        const miner = new Miner(mnemonic, 'self', [], [])
        setMiner(miner)
    }
    const onMnemonicCreateButtonClicked = (e: any) => {
        const miner = Miner.GenerateRandom('self')
        setMnemonic(miner.getMnemonic())
        setMiner(miner)
    }
    const onWalletSelected = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (!miner) {
            return
        }
        const selected = miner.getWallets().find(x => x.getAddress() == e.target.value)
        if (!selected) {
            return
        }
        setSelectedWallet(selected)
    }

    const onDesinationAddressChanged = (e: any) => {
        setDestinationAddress(e.target.value)
    }
    const onDestinationAmountChanged = (e: any) => {
        try {
            const amount = BigInt(e.target.value)
            setDestinationAmountString(e.target.value)
            setDestinationAmount(amount)
        }catch{
            setDestinationAmount(BigInt(0))
        }
    }
    const onDestinationMessageChanged = (e: any) => {
        setDestinationMessage(e.target.value)
    }
    const onSendButtonClicked = (e: any) => {
        if (!selectedWallet || !destinationAddress) {
            return
        }
        const from = selectedWallet.getAddressBuffer()
        const dest = new Destination(Buffer.from(destinationAddress, 'hex'),
            destinationAmount,
            Buffer.from(destinationMessage, 'utf8'))
        const tx = new Transaction(from, BigInt(10), [dest])
        const signature = selectedWallet.signTransaction(tx)
        tx.setSignature(signature)
        onSend(tx.encodeToHex())
    }

    return <div>
        <input placeholder="Type mnemonic to import"
        value={mnemonic}
        onChange={onMnemonicChange} />
        <button onClick={onImport}>
            import
        </button>
        <button onClick={onMnemonicCreateButtonClicked}>
            generate
        </button>
        <br />
        <select size={10} onChange={onWalletSelected}>
            {miner?.getWallets().map((w, i) => (
                <option key={i}>{w.getAddress()}</option>
            ))}
        </select>
        <br />
        <p>Send Transaction</p>
        Wallet: {selectedWallet?.getAddress()}
        <br />
        <input placeholder="Type destination address"
            value={destinationAddress}
            onChange={onDesinationAddressChanged} />
        <br />
        <input placeholder="Type destination amount"
            value={destinationAmountString}
            onChange={onDestinationAmountChanged} />
        <br />
        <input placeholder="Type destination message"
            value={destinationMessage}
            onChange={onDestinationMessageChanged} />
        <br />
        <div>
            From: {selectedWallet?.getAddress()}
            <br />
            To: {destinationAddress}
            <br />
            Amount: {destinationAmountString}
            <br />
            Message: {destinationMessage}
            <br />
            <button onClick={onSendButtonClicked}>
                Send
            </button>
        </div>
    </div>
}