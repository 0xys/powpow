import '../styles/globals.css'
import type { AppProps } from 'next/app'
import React, { useState } from 'react'
import Link from 'next/link'
import { ChakraProvider, HStack } from '@chakra-ui/react'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider>
      <div>
        <HStack>
          <Link href="/">Home</Link>
          <Link href="/tutorials/hex">16進数とは</Link>
          <Link href="/tutorials/hash">ハッシュ関数とは</Link>
          <Link href="/tutorials/signature">電子署名とは</Link>
          <Link href="/tutorials/transaction">トランザクションとは</Link>
          <Link href="/tutorials/pow">マイニングとは</Link>
        </HStack>
        <Component {...pageProps} />
      </div>
    </ChakraProvider> 
  )
}

export default MyApp
