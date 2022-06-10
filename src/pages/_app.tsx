import '../styles/globals.css'
import type { AppProps } from 'next/app'
import React, { useState } from 'react'
import Link from 'next/link'
import { ChakraProvider } from '@chakra-ui/react'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider>
      <div>
        <nav>
          <ul>
            <li>
              <Link href="/">Home</Link>
            </li>
            <li>
              <Link href="/tutorials/hex">Hex</Link>
            </li>
            <li>
              <Link href="/tutorials/hash">Hash</Link>
            </li>
            <li>
              <Link href="/tutorials/signature">Signature</Link>
            </li>
            <li>
              <Link href="/tutorials/transaction">Transaction</Link>
            </li>
            <li>
              <Link href="/tutorials/pow">PoW</Link>
            </li>
          </ul>
        </nav>
        <Component {...pageProps} />
      </div>
    </ChakraProvider> 
  )
}

export default MyApp
