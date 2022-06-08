import '../styles/globals.css'
import type { AppProps } from 'next/app'
import React, { useState } from 'react'
import Link from 'next/link'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div>
      <nav>
        <ul>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href="/about">About</Link>
          </li>
          <li>
            <Link href="/pow">PoW</Link>
          </li>
        </ul>
      </nav>
      <Component {...pageProps} />
    </div>
  )
}

export default MyApp
