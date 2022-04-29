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
import { Block } from '../types/blockchain/block'

export let socket: Socket<DefaultEventsMap, DefaultEventsMap>

const version = BigInt(0)

const Home: NextPage = () => {
  const [input, setInput] = useState('')

  const [blocks, setBlocks] = useState<Block[]>([])
  const [receivedBlock, setReceivedBlock] = useState<Block>()

  const [mempool, setMempool] = useState<Mempool>()
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction>()
  const [receivedTx, setReceivedTx] = useState<Transaction>()

  const [blockFactory, setBlockFactory] = useState<Block>()
  const [minedBlock, setMinedBlock] = useState<Block>()
  const [nonce, setNonce] = useState<bigint>(BigInt(0))

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

  useEffect(() => {
    if(blockFactory) {
      const mine = async () => {
        let current = nonce
        while (true) {
          current += BigInt(1)
          await new Promise(resolve => setTimeout(resolve, 100))
          setNonce(current)
          const hash = blockFactory.hashWith(current)[0]
          if (hash < 10) {
            const mined = new Block(version, blockFactory.getHeight(), blockFactory.getPrevBlockHash(), blockFactory.getTransactions(), current)
            setMinedBlock(mined)
            break
          }
        }
      }
      mine()
    }
  }, [blockFactory])

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
    const nextHeight = blocks.length
    let prevBlockHash = Buffer.allocUnsafe(32).fill("00")
    if (nextHeight > 0) {
      prevBlockHash = blocks[nextHeight-1].hash()
    }

    if (blockFactory) {
      const afterTxs = [...blockFactory.getTransactions(), selectedTransaction]
      const afterBlock = new Block(version, BigInt(nextHeight), prevBlockHash, afterTxs, blockFactory.getNonce())
      setBlockFactory(afterBlock)
    }else{
      const afterTxs = [selectedTransaction]
      const afterBlock = new Block(version, BigInt(nextHeight), prevBlockHash, afterTxs, BigInt(0))
      setBlockFactory(afterBlock)
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
    if (!minedBlock) {
      return
    }
    setBlockFactory(undefined)
    setMinedBlock(undefined)
    setBlocks([...blocks, minedBlock])
  }

  return (
    <div>
      <WalletComponent onSend={onSendHandler}/>
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
        {blockFactory?.getTransactions().map((tx, i) =>(
          <li key={i}>{tx.hashString()}</li>
        ))}
      </ul>
      <br />
      <p>{nonce.toString()}</p>
      <p>mined: {minedBlock?.hashString()}</p>
      <button onClick={onPropagateBlockHandler}>
        propagate
      </button>
      <br />
      Blocks
      <br />
      <ul>
        {blocks.map((block, i) => (
          <div key={i}>
            {i}: {block.hashString()}
            <br />
            <li>
              <ul>
                {block.getTransactions().map((tx,j) => (
                  <li key={j}>{tx.hashString()}</li>
                ))}
              </ul>
            </li>
          </div>
          
        ))}
      </ul>
    </div>
  )
}

export default Home
