import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { BlockchainValidator } from '../consensus/blockchain_validator'
import { TransactionVerifier } from '../consensus/transaction_verifiier'
import { ConsensusEngine } from '../consensus/consensus_engine'
import React from 'react'

const verifier = new TransactionVerifier()
const consensus = new ConsensusEngine()
const defaultValidator = new BlockchainValidator(verifier, consensus)

const BlockchainContext = React.createContext<BlockchainValidator>(defaultValidator)

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <BlockchainContext.Provider value={defaultValidator}>
      <Component {...pageProps} />
    </BlockchainContext.Provider>
  )
}

export default MyApp
