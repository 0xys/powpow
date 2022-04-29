import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { DefaultEventsMap } from 'socket.io/dist/typed-events'
import styles from '../styles/Home.module.css'

export let socket: Socket<DefaultEventsMap, DefaultEventsMap>

type Transaction = {
  message: string
}

type Block = {
  transactions: Transaction[]
}

const Home: NextPage = () => {
  const [input, setInput] = useState('')

  const [blocks, setBlocks] = useState<Block[]>([])
  const [receivedBlock, setReceivedBlock] = useState<Block>()

  const [mempool, setMempool] = useState<Transaction[]>([])
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
        setReceivedTx({message: msg})
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
      setMempool([...mempool, receivedTx])
    }
  }, [receivedTx])


  const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    // socket.emit('input-change', e.target.value)
  }

  const onMempoolSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const index = mempool.findIndex(x => x.message == e.target.value)
    if (index < 0) {
      return
    }
    const selected = mempool[index]
    const after: Transaction[] = []
    for (let i=0;i<mempool.length;i++){
      if (i != index) {
        after.push(mempool[i])
      }
    }
    setSelectedTransaction(selected)
    setMempool(after)
  }

  const onClickHandler = (e: any) => {
    socket.emit('send', e.target.value)
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
      setMempool([...mempool, selectedTransaction])
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
      <select onChange={onMempoolSelectionChange} multiple={true} size={10}>
        {mempool.map((tx, i) => (
          <option key={i}>{tx.message}</option>
        ))}
      </select>
      <br />
      Selected: {selectedTransaction?.message}
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
        {block?.transactions.map(tx =>(
          <li>{tx.message}</li>
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
          <li>
            {i}
            <ul>
              {block.transactions.map(tx => (
                <li>{tx.message}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Home
