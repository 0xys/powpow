import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { DefaultEventsMap } from 'socket.io/dist/typed-events'
import styles from '../styles/Home.module.css'

export let socket: Socket<DefaultEventsMap, DefaultEventsMap>

type Block = {
  message: string
}

const Home: NextPage = () => {
  const [input, setInput] = useState('')
  const [newBlock, setNewBlock] = useState<Block>()
  const [blocks, setBlocks] = useState<Block[]>([])

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

      socket.on('new-block', msg => {
        setNewBlock({message: msg})
      })
    }
    socketInitializer()
  }, [])

  useEffect(() => {
    if(newBlock){
      setBlocks([...blocks, newBlock])
    }
  }, [newBlock])


  const onChangeHandler = (e: any) => {
    setInput(e.target.value)
    // socket.emit('input-change', e.target.value)
  }

  const onClickHandler = (e: any) => {
    socket.emit('send', e.target.value)
  }

  return (
    <div>
      <input
        placeholder="Type something"
        value={input}
        onChange={onChangeHandler}
      />
      <button onClick={onClickHandler} value={input}>
        send
      </button>
      <ul>
        {blocks.map(block => (
          <li>{block.message}</li>
        ))}
      </ul>
    </div>
    
  )
}

export default Home
