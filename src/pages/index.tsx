import { randomBytes } from 'crypto'
import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { DefaultEventsMap } from 'socket.io/dist/typed-events'
import { WalletComponent } from './components/wallet'
import styles from '../styles/Home.module.css'
import { Destination, Transaction } from '../types/blockchain/transaction'
import { Mempool } from '../types/miner/mempool'

export let socket: Socket<DefaultEventsMap, DefaultEventsMap>

type Block = {
  transactions: Transaction[]
}

const Home: NextPage = () => {
  const [input, setInput] = useState('')

  const [blocks, setBlocks] = useState<Block[]>([])
  const [receivedBlock, setReceivedBlock] = useState<Block>()

  const [mempool, setMempool] = useState<Mempool>()
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction>()
  const [receivedTx, setReceivedTx] = useState<Transaction>()

  const [block, setBlock] = useState<Block>()

  useEffect(() => {
    const socketInitializer = async () => {
      await fetch('api/socket')
      socket = io()
  
      socket.on('connect', () => {
        console.log('connected')
      })

      socket.on('update-input', msg => {
        setInput(msg)
      })

      socket.on('new-transaction', msg => {
        const transaction = Transaction.decode(Buffer.from(msg, 'hex'))
        console.log('received: ', transaction.hashString())
        setReceivedTx(transaction)
      })
    }
    socketInitializer()
  }, [])

  useEffect(() => {
    if(receivedBlock){
      setBlocks([...blocks, receivedBlock])
    }
  }, [receivedBlock])

  useEffect(() => {
    if (receivedTx){
      if (mempool){
        mempool.put(receivedTx)
        const after = new Mempool(mempool.getTransactionsArray())
        setMempool(after)
      }else{
        const mempool = new Mempool([receivedTx])
        setMempool(mempool)
      }
    }
  }, [receivedTx])


  const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    // socket.emit('input-change', e.target.value)
  }

  const onMempoolSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!mempool) {
      return
    }
    console.log(e.target.value)
    const selectedHash: string = e.target.value
    const {found, tx} = mempool.tryGetTransactionByHashString(selectedHash)
    if (found){
      setSelectedTransaction(tx)
    }
  }

  const onSendHandler = (e: string) => {
    console.log(e)
    socket.emit('send', e)
  }

  const onAddHandler = (e: any) => {
    if (!selectedTransaction) {
      return
    }
    if (block) {
      const afterTxs = [...block.transactions, selectedTransaction]
      const afterBlock: Block = {
        transactions: afterTxs
      }
      setBlock(afterBlock)
    }else{
      const afterBlock: Block = {
        transactions: [selectedTransaction]
      }
      setBlock(afterBlock)
    }
    if (mempool) {
      mempool.removeTransactionByHashString(selectedTransaction.hashString())
      const after = new Mempool(mempool.getTransactionsArray())
      setMempool(after)
    }
    setSelectedTransaction(undefined)
  }
  const onDiscardHandler = (e: any) => {
    if (!selectedTransaction || !mempool) {
      return
    }
    mempool.removeTransactionByHashString(selectedTransaction.hashString())
    const after = new Mempool(mempool.getTransactionsArray())
    setMempool(after)
    setSelectedTransaction(undefined)
  }
  const onPropagateBlockHandler = (e: any) => {
    if (!block) {
      return
    }
    setBlock(undefined)
    setBlocks([...blocks, block])
  }

  return (
    <div>
      <WalletComponent onSend={onSendHandler}/>
      <input
        placeholder="Type transaction message"
        value={input}
        onChange={onChangeHandler}
      />
      <br />
      Mempool
      <br />
      <select onChange={onMempoolSelectionChange} size={10}>
        {mempool?.getTransactionsArray().map((tx, i) => (
          <option key={i}>{tx.hashString()}</option>
        ))}
      </select>
      <br />
      Selected: {selectedTransaction?.hashString()}
      <br />
      From: {selectedTransaction?.getFromAddressString()}
      <br />
      To: {selectedTransaction?.getDests()[0].getAddressString()}
      <br />
      Amount: {selectedTransaction?.getDests()[0].getAmount().toString()}
      <br />
      Message: {selectedTransaction?.getDests()[0].getMessageUtf8()}
      <br />
      <button onClick={onAddHandler}>
        add
      </button>
      <button onClick={onDiscardHandler}>
        discard
      </button>
      <br />
      <br />
      Block
      <br />
      <ul>
        {block?.transactions.map((tx, i) =>(
          <li key={i}>{tx.hashString()}</li>
        ))}
      </ul>
      <br />
      <button onClick={onPropagateBlockHandler}>
        propagate
      </button>
      <br />
      Blocks
      <br />
      <ul>
        {blocks.map((block, i) => (
          <li key={i}>
            {i}
            <ul>
              {block.transactions.map((tx,j) => (
                <li key={j}>{tx.hashString()}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Home
