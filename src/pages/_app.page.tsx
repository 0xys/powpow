import '../styles/globals.css'
import type { AppProps } from 'next/app'
import React, { useState } from 'react'
import { ChakraProvider, HStack, Link } from '@chakra-ui/react'
import Layout from './components/layout'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider>
      <div>
        <HStack bgColor='#2a6bd5' color='white' padding='1em'>
          <Link href="/">Powpow</Link>
          <Link href="/tutorials/hex">16進数とは</Link>
          <Link href="/tutorials/hash">ハッシュ関数とは</Link>
          <Link href="/tutorials/signature">電子署名とは</Link>
          <Link href="/tutorials/transaction">トランザクション受付</Link>
          <Link href="/tutorials/block">ブロックボディ生成</Link>
          <Link href="/tutorials/pow">マイニング</Link>
        </HStack>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </div>
    </ChakraProvider> 
  )
}

export default MyApp
