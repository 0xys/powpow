import { randomBytes } from 'crypto'
import type { NextPage } from 'next'
import useSWR from 'swr'
import Head from 'next/head'
import Image from 'next/image'
import { useCallback, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { DefaultEventsMap } from 'socket.io/dist/typed-events'
import { FetchedWallet, WalletComponent } from './components/wallet'
import styles from '../styles/Home.module.css'
import { Destination, Transaction } from '../types/blockchain/transaction'
import { Mempool } from '../types/miner/mempool'
import { Block } from '../types/blockchain/block'
import { Miner } from '../types/miner/miner'
import { Wallet } from '../types/miner/wallet'
import { Blockchain } from '../types/blockchain/blockchain'
import { BlockchainValidator } from '../consensus/blockchain_validator'
import { TransactionVerifier } from '../consensus/transaction_verifiier'
import { ConsensusEngine } from '../consensus/consensus_engine'
import { BlockFactoryComponent, TxError } from './components/blockFactory'
import { reorg } from '../consensus/reorger'
import axios from 'axios'
import { Account } from '../connection/account_api'
import { MempoolComponent } from './components/mempool'
import { TransactionPreviewComponent } from './components/transaction_preview'

// let socket: Socket<DefaultEventsMap, DefaultEventsMap>

const version = BigInt(0)
const blockReward = BigInt(10000)

const fetcher = (url: string) => fetch(url).then(res => res.json())
export type TryAppendBlock = (block: Block) => boolean

const verifier = new TransactionVerifier()
const consensus = new ConsensusEngine()
const defaultValidator = new BlockchainValidator(verifier, consensus)

const Home: NextPage = () => {
  const [socket, _] = useState(() => io())
  const [mnemonic, setMnemonic] = useState<string>('')
  const [miner, setMiner] = useState<Miner>()
  const [selectedWallet, setSelectedWallet] = useState<Wallet>()
  const [fetchedWallet, setFetchedWallet] = useState<FetchedWallet>()

  const [receivedBlock, setReceivedBlock] = useState<Block>()

  const [mempool, setMempool] = useState<Mempool>()
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction>()
  const [receivedTx, setReceivedTx] = useState<Transaction>()

  const [txerrors, setTxErrors] = useState<TxError[]>([])
  const [blockFactory, setBlockFactory] = useState<Block>()
  const [minedBlock, setMinedBlock] = useState<Block>()
  const [nonce, setNonce] = useState<bigint>(BigInt(0))

  const [blockchain, setBlockchain] = useState<Blockchain>(new Blockchain([]))
  const [validator, setValidator] = useState<BlockchainValidator>(defaultValidator)
  const [receivedBlockValidaity, setReceivedBlockValidaity] = useState<boolean>()

  const tryAppendBlock: TryAppendBlock = (block: Block): boolean => {
    const error = validator.tryAppendBlock(blockchain, block)
    if(error) {
      console.log(error)
      setReceivedBlockValidaity(false)
      return false
    }
    setReceivedBlockValidaity(true)

    setBlockchain({...blockchain})

    const afeterV = new BlockchainValidator(verifier, consensus)
    afeterV.cache = validator.cache;
    setValidator(afeterV)
    return true
  }

  const dryRunTransactions = (transactions: Transaction[]): boolean => {
    const error = validator.dryAppendTransactions(blockchain, transactions)
    if(error) {
      console.log(error)
      const e: TxError = {
        index: error.transactionIndex,
        message: error.message,
      }
      setTxErrors([e])
      return false
    }else{
      setTxErrors([])
    }
    return true
  }

  useEffect(() => {
    if(!miner) {
      return
    }

    const socketInitializer = async () => {
      //await fetch('api/socket')
      await axios.post('api/socket', {pubkey: miner.getNodePublicKeyString()})
  
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

    // poll new block every 10 seconds
    const blockPoller = async () =>{
      while(true){
        const res: {height: number, blockHex?: string} = await fetcher('api/blocks/latest')
        console.log(res)
        if (!res.blockHex) {
          await new Promise(resolve => setTimeout(resolve, 10_000))
          continue
        }
        console.log('latest block:', res.height)
        const blob = Buffer.from(res.blockHex, 'hex')
        let currentLatestBlock = Block.decode(blob)
      
        const reorgedChain = await reorg(validator.blocks, currentLatestBlock, async (hash: string) => fetcher(`api/blocks/${hash}`))

        //  replace reorged portion of blockchain with correct one
        if(reorgedChain.length > 0) {
          const reorgStartHeight = Number(reorgedChain[0].getHeight())

          const newBlockchain = new Blockchain([...blockchain.blocks.slice(0, reorgStartHeight), ...reorgedChain])
          const newValidator = new BlockchainValidator(verifier, consensus)
          const err = newValidator.validateEntireChainFromZero(newBlockchain)
          if(err) {
            console.log(err)
            await new Promise(resolve => setTimeout(resolve, 10_000))
            continue
          }

          setBlockchain(newBlockchain)
          setValidator(newValidator)
        }

        await new Promise(resolve => setTimeout(resolve, 10_000))
      }
    }
    socketInitializer()
    blockPoller()
  }, [miner])

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
    
    const nextHeight = blockchain.blocks.length
    let prevBlockHash = blockchain.hash()
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

  const { data: fetchedAccount, error: fetchError } = useSWR<Account>(selectedWallet ? `api/accounts/${selectedWallet.getAddress()}` : null, fetcher)
  
  useEffect(() => {
    if (fetchedAccount && selectedWallet) {
      setFetchedWallet({
        wallet: selectedWallet,
        seq: BigInt(fetchedAccount.sequence),
        balance: BigInt(fetchedAccount.balance),
      })
    }
  }, [fetchedAccount])

  useEffect(() => {
    if (fetchError) {
      setFetchedWallet(undefined)
      return
    }
  }, fetchError)
  
  // try mining block 
  useEffect(() => {
    if(!blockFactory) {
      return
    }

    //  don't mine when block is invalid
    if(txerrors.length > 0) {
      return;
    }

    const mine = async () => {
      let current = nonce
      while (true) {
        const candidate = blockFactory.mutateNonce(current)
        if (validator.getConsensusEngine().isSolved(candidate)) {
          const mined = new Block(version, blockFactory.getHeight(), blockFactory.getPrevBlockHash(), blockFactory.getTransactions(), current)
          setMinedBlock(mined)
          break
        }
        await new Promise(resolve => setTimeout(resolve, 100))
        current += BigInt(1)
        setNonce(current)
      }
    }
    mine()
  }, [blockFactory])

  //  when receiving new block 
  useEffect(() => {
    if (receivedBlock) {
      if (BigInt(blockchain.blocks.length) == receivedBlock.getHeight()){
        console.log('received and append to', blockchain.blocks)
        const success = tryAppendBlock(receivedBlock)
        console.log(success)
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

  const onSendHandler = useCallback((e: string) => {
    console.log('broadcast tx:', e)
    socket.emit('send', e)
  }, [socket])

  const removeFromMempool = useCallback((hash: string) => {
    if(!mempool) {
      return
    }
    mempool.removeTransactionByHashString(hash)
    const after = new Mempool(mempool.getTransactionsArray())
    setMempool(after)
  }, [mempool])

  const selectFromMempool = useCallback((hash: string) => {
    if(!mempool) {
      return
    }
    const {found, tx} = mempool.tryGetTransactionByHashString(hash)
    if (found){
      setSelectedTransaction(tx)
    }
  }, [mempool])

  const addFromSelectedTransaction = useCallback((hash: string) => {
    if (!selectedTransaction) {
      return
    }
    const nextHeight = blockchain.blocks.length
    let prevBlockHash = blockchain.hash()

    if (blockFactory) {
      const afterTxs = [...blockFactory.getTransactions(), selectedTransaction]
      const success = dryRunTransactions(afterTxs)
      if (!success) {
        console.log('error in block factory', success)
        //return
      }

      const afterBlock = new Block(version, BigInt(nextHeight), prevBlockHash, afterTxs, blockFactory.getNonce())
      setBlockFactory(afterBlock)
    }else{
      const afterTxs = [selectedTransaction]
      const success = dryRunTransactions(afterTxs)
      if (!success) {
        console.log('error in block factory', success)
        //return
      }
      
      const afterBlock = new Block(version, BigInt(nextHeight), prevBlockHash, afterTxs, BigInt(0))
      setBlockFactory(afterBlock)
    }
    if (mempool) {
      mempool.removeTransactionByHashString(selectedTransaction.hashString())
      const after = new Mempool(mempool.getTransactionsArray())
      setMempool(after)
    }
    setSelectedTransaction(undefined)
  }, [blockchain, mempool, blockFactory, selectedTransaction])

  const discardFromMempool = useCallback((hash: string) => {
    if (!mempool) {
      return
    }
    mempool.removeTransactionByHashString(hash)
    const after = new Mempool(mempool.getTransactionsArray())
    setMempool(after)
    setSelectedTransaction(undefined)
  }, [mempool])

  const onTransactionRemovedFromFactory = useCallback((hash: string) => {
    const nextHeight = blockchain.blocks.length
    let prevBlockHash = blockchain.hash()
    let afterTxs: Transaction[] = []

    for (const tx of blockFactory?.getTransactions() ?? []) {
      if(tx.hashString() != hash){
        afterTxs.push(tx)
      }
    }

    const success = dryRunTransactions(afterTxs)
    if (!success) {
      console.log('error in block factory after removal', success)
    }

    const afterBlock = new Block(version, BigInt(nextHeight), prevBlockHash, afterTxs, BigInt(0))
    setBlockFactory(afterBlock)
  }, [blockchain, blockFactory])

  const onBlockPropagated = (e: any) => {
    if (!minedBlock) {
      return
    }
    setBlockFactory(undefined)
    setMinedBlock(undefined)
    console.log('mined and append to', blockchain.blocks)
    const success = tryAppendBlock(minedBlock)
    if (!success) {
      console.log('error propagating block', success)
      return
    }
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
      <WalletComponent onSend={onSendHandler} wallet={fetchedWallet} />
      <br />
      Mempool
      <br />
      {
        mempool ? <MempoolComponent mempool={mempool}
          onRemove={removeFromMempool} onSelect={selectFromMempool} />
        : <div></div>
      }
      <br />
      {
        selectedTransaction ? <TransactionPreviewComponent tx={selectedTransaction}
        onAdd={addFromSelectedTransaction} onDiscard={discardFromMempool}/>
        : <div></div>
      }
      <br />
      <BlockFactoryComponent transactions={blockFactory?.getTransactions()??[]}
        txerrors={txerrors}
        height={blockFactory?.getHeight().toString()??''}
        removeTransaction={onTransactionRemovedFromFactory} />
      <br />
      <p>{nonce.toString()}</p>
      <p>mined: {minedBlock?.hashString()}</p>
      <button onClick={onBlockPropagated} disabled={txerrors.length > 0 || !minedBlock}>
        {txerrors.length > 0 ? 'invalid block' : 'propagate'}
      </button>
      <br />
      Blocks
      <br />
      <ul>
        {blockchain.blocks.map((block, i) => (
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
