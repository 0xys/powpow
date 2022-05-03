import { randomBytes } from 'crypto'
import type { NextPage } from 'next'
import useSWR from 'swr'
import Head from 'next/head'
import Image from 'next/image'
import { useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { DefaultEventsMap } from 'socket.io/dist/typed-events'
import { WalletComponent } from './components/wallet'
import styles from '../styles/Home.module.css'
import { Destination, Transaction } from '../types/blockchain/transaction'
import { Mempool } from '../types/miner/mempool'
import { Block } from '../types/blockchain/block'
import { Miner } from '../types/miner/miner'
import { Wallet } from '../types/miner/wallet'
import { BlockchainContextTheme } from './_app'

export let socket: Socket<DefaultEventsMap, DefaultEventsMap>

const version = BigInt(0)
const blockReward = BigInt(10000)

const Home: NextPage = () => {
  const [mnemonic, setMnemonic] = useState<string>('')
  const [miner, setMiner] = useState<Miner>()
  const [selectedWallet, setSelectedWallet] = useState<Wallet>()
  const [isLoadingAccount, setIsLoadingAccount] = useState<boolean>(true)

  const [blocks, setBlocks] = useState<Block[]>([])
  const [receivedBlock, setReceivedBlock] = useState<Block>()

  const [mempool, setMempool] = useState<Mempool>()
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction>()
  const [receivedTx, setReceivedTx] = useState<Transaction>()

  const [blockFactory, setBlockFactory] = useState<Block>()
  const [minedBlock, setMinedBlock] = useState<Block>()
  const [nonce, setNonce] = useState<bigint>(BigInt(0))

  const context = useContext(BlockchainContextTheme)

  useEffect(() => {
    const socketInitializer = async () => {
      await fetch('api/socket')
      socket = io()
  
      socket.on('connect', () => {
        console.log('connected')
      })

      socket.on('new-transaction', msg => {
        const transaction = Transaction.decode(Buffer.from(msg, 'hex'))
        console.log('tx received: ', transaction.hashString())
        setReceivedTx(transaction)
      })

      socket.on('new-block', msg => {
        const block = Block.decode(Buffer.from(msg, 'hex'))
        console.log('block received: ', block.hashString())
        setReceivedBlock(block)
      })
    }
    socketInitializer()
  }, [])

  // mempool receives transaction
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

  //  init with coinbase
  useEffect(() => {
    if(!selectedWallet) {
      return
    }
    
    const nextHeight = blocks.length
    let prevBlockHash = Buffer.allocUnsafe(32).fill("00")
    if (nextHeight > 0) {
      prevBlockHash = blocks[nextHeight-1].hash()
    }
    const coinbase = Transaction.Coinbase(BigInt(nextHeight), selectedWallet.getPrivateKey(), blockReward)
    let afterTxs: Transaction[] = []
    if(blockFactory) {
      if (blockFactory.getTransactions().length > 0) {
        if (blockFactory.getTransactions()[0].isCoinbase()) {
          afterTxs = [coinbase, ...blockFactory.getTransactions().slice(1)]
        }else{
          afterTxs = [coinbase, ...blockFactory.getTransactions()]
        }
      }else{
        afterTxs = [coinbase]
      }
      const afterBlock = new Block(version, BigInt(nextHeight), prevBlockHash, afterTxs, BigInt(0))
      setBlockFactory(afterBlock)
    }else{
      const afterTxs = [coinbase]
      const afterBlock = new Block(version, BigInt(nextHeight), prevBlockHash, afterTxs, BigInt(0))
      setBlockFactory(afterBlock)
    }
  }, [selectedWallet])

  // try mining block 
  useEffect(() => {
    if(blockFactory) {
      const mine = async () => {
        let current = nonce
        while (true) {
          current += BigInt(1)
          await new Promise(resolve => setTimeout(resolve, 100))
          setNonce(current)
          const candidate = blockFactory.mutateNonce(current)
          if (context.getConsensusEngine().isSolved(candidate)) {
            const mined = new Block(version, blockFactory.getHeight(), blockFactory.getPrevBlockHash(), blockFactory.getTransactions(), current)
            setMinedBlock(mined)
            break
          }
        }
      }
      mine()
    }
  }, [blockFactory])

  //  when receiving new block 
  useEffect(() => {
    if (receivedBlock) {
      if (BigInt(blocks.length) == receivedBlock.getHeight()){
        setBlocks([...blocks, receivedBlock])
        return
      }
    }
  }, [receivedBlock])

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
    console.log('broadcast tx:', e)
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

    const message = minedBlock.encodeToHex()
    console.log('propagate block:', message)
    socket.emit('propagate', message)
  }

  return (
    <div>
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
      <WalletComponent onSend={onSendHandler} wallet={selectedWallet} />
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
            {block.getHeight().toString()}: {block.hashString()}
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
