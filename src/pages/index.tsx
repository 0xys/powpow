import { randomBytes } from 'crypto'
import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { DefaultEventsMap } from 'socket.io/dist/typed-events'
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
    // setInput(e.target.value)
    // socket.emit('input-change', e.target.value)
  }

  const onMempoolSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!mempool) {
      return
    }
    console.log(e.target.value)
    const selectedHash: string = e.target.value
    const tx = mempool.removeTransactionByHashString(selectedHash)
    setSelectedTransaction(tx)

    const after = new Mempool(mempool.getTransactionsArray())
    setMempool(after)
  }

  const onClickHandler = (e: any) => {
    const from = randomBytes(33)
    const to = randomBytes(33)
    const amount = BigInt(123)
    const message = Buffer.from(e.target.value, 'utf8')
    const tx = new Transaction(from, BigInt(10), [new Destination(to, amount, message)])
    socket.emit('send', tx.encode().toString('hex'))
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
    setSelectedTransaction(undefined)

  }
  const onBackHandler = (e: any) => {
    if (selectedTransaction) {
      setSelectedTransaction(undefined)
      if (mempool) {
        mempool?.put(selectedTransaction)
        const after = new Mempool(mempool.getTransactionsArray())
        setMempool(after)
      }else{
        const after = new Mempool([selectedTransaction])
        setMempool(after)
      }
    }
  }
  const onDiscardHandler = (e: any) => {
    if (selectedTransaction) {
      setSelectedTransaction(undefined)
    }
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
      <input
        placeholder="Type transaction message"
        value={input}
        onChange={onChangeHandler}
      />
      <button onClick={onClickHandler} value={input}>
        send
      </button>
      <br />
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
      Message: {selectedTransaction?.getDests()[0].getMessageUtf8()}
      <br />
      <button onClick={onAddHandler}>
        add
      </button>
      <button onClick={onBackHandler}>
        back
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
