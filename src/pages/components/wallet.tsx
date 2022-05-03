import type { NextPage } from 'next'
import { useState } from 'react'
import { Destination, Transaction } from '../../types/blockchain/transaction'
import { Miner } from '../../types/miner/miner'
import { Wallet } from '../../types/miner/wallet'

type OnSendHandler = (txBlob: string) => void
export type FetchedWallet = {
    seq: bigint,
    balance: bigint,
    wallet: Wallet
}

export const WalletComponent = 
    (prop: {
        onSend: OnSendHandler,
        wallet: FetchedWallet|undefined,
    }) => {
    const { onSend, wallet, } = prop

    const [destinationAddress, setDestinationAddress] = useState<string>('')
    const [destinationAmountString, setDestinationAmountString] = useState<string>('')
    const [destinationAmount, setDestinationAmount] = useState<bigint>(BigInt(0))
    const [destinationMessage, setDestinationMessage] = useState<string>('')

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
        if (!wallet || !destinationAddress) {
            return
        }
        const from = wallet.wallet.getAddressBuffer()
        const seq = wallet.seq
        const dest = new Destination(Buffer.from(destinationAddress, 'hex'),
            destinationAmount,
            Buffer.from(destinationMessage, 'utf8'))
        const tx = new Transaction(from, seq, BigInt(10), [dest])
        const signature = wallet.wallet.signTransaction(tx)
        tx.setSignature(signature)
        onSend(tx.encodeToHex())
    }

    return <div>
        
        <br />
        <p>Send Transaction</p>
        Wallet: {wallet?.wallet.getAddress()} {wallet?.balance.toString()} pow
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
            From: {wallet?.wallet.getAddress()}
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