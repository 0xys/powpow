import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { BlockchainValidator } from '../consensus/blockchain_validator'
import { TransactionVerifier } from '../consensus/transaction_verifiier'
import { ConsensusEngine } from '../consensus/consensus_engine'
import React from 'react'
import { BlockchainContext } from '../types/blockchain_context'

const verifier = new TransactionVerifier()
const consensus = new ConsensusEngine()
const defaultValidator = new BlockchainValidator(verifier, consensus)
const blockchainContext = new BlockchainContext(defaultValidator)

export const BlockchainContextTheme = React.createContext<BlockchainContext>(blockchainContext)

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <BlockchainContextTheme.Provider value={blockchainContext}>
      <Component {...pageProps} />
    </BlockchainContextTheme.Provider>
  )
}

export default MyApp
