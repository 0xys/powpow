import { Box, VStack, HStack, Input, Button, Divider, Heading, ButtonGroup, IconButton, Textarea, InputGroup, InputLeftAddon, useToast, Alert, AlertIcon, AlertTitle, SimpleGrid, Center } from '@chakra-ui/react'
import { AddIcon, CopyIcon } from '@chakra-ui/icons'
import { useCallback, useEffect, useMemo, useState } from 'react'
import crypto from 'crypto'
import { createHash } from 'crypto';
import { hexFont } from '../components/hex/hexOneline';
import { HexOnelineView } from '../components/hex/hexOnelineView';

const Octet = (prop: {
  index: number,
  hex: string,
  selected: boolean,
  onHover: (index: number) => void
}) => {
  return (<Center
    width='4ch'
    height='4ch'
    fontFamily={hexFont}
    background={prop.selected ? 'blue.300': 'white'}
    onMouseEnter={(e: any) => prop.onHover(prop.index)}
    >
      {prop.hex}
    </Center>)
}

export default function Pow() {
  const [bytes, setBytes] = useState<Uint8Array>(Uint8Array.from(Buffer.allocUnsafe(80).fill(0)))
  const [selectionArray, setSelectionArray] = useState<boolean[]>()
  const [label, setLabel] = useState('')
  const [selectedBytes, setSelectedBytes] = useState<Uint8Array>()
  const toast = useToast()

  useEffect(() => {
    setBytes(Uint8Array.from(crypto.randomBytes(80)))
  }, [])

  const hexArray = useMemo(() => {
    const buf = Buffer.from(bytes)
    return buf.toJSON()
      .data
      .map(v => {
        if (v < 16) {
          return '0' + v.toString(16)
        }else{
          return v.toString(16)
        }
      })
  }, [bytes])

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
        title: 'Copied!',
        status: 'info',
        duration: 750,
        isClosable: true,
    })
  }

  const onHover = (index: number) => {
    if (index < 0) {
      const array = Array.apply(null, Array(80)).map((v,i) => false)
      setSelectionArray(array)
      return
    }

    if (index < 4) {
      const array = Array.apply(null, Array(80)).map((v,i) => i < 4)
      setLabel('version')
      setSelectionArray(array)
      setSelectedBytes(bytes?.slice(0, 4) ?? Uint8Array.from([]))
    } else if (index < 8) {
      const array = Array.apply(null, Array(80)).map((v,i) => i >= 4 && i < 8)
      setLabel('block height')
      setSelectionArray(array)
      setSelectedBytes(bytes?.slice(4, 8) ?? Uint8Array.from([]))
    } else if (index < 40) {
      const array = Array.apply(null, Array(80)).map((v,i) => i >= 8 && i < 40)
      setLabel('previous block hash')
      setSelectionArray(array)
      setSelectedBytes(bytes?.slice(8, 40) ?? Uint8Array.from([]))
    } else if (index < 44) {
      const array = Array.apply(null, Array(80)).map((v,i) => i >= 40 && i < 44)
      setLabel('difficulty target')
      setSelectionArray(array)
      setSelectedBytes(bytes?.slice(40, 44) ?? Uint8Array.from([]))
    } else if (index < 76) {
      const array = Array.apply(null, Array(80)).map((v,i) => i >= 44 && i < 76)
      setLabel('merkle root')
      setSelectionArray(array)
      setSelectedBytes(bytes?.slice(44, 76) ?? Uint8Array.from([]))
    } else {
      const array = Array.apply(null, Array(80)).map((v,i) => i >= 76)
      setLabel('nonce')
      setSelectionArray(array)
      setSelectedBytes(bytes?.slice(76, 80) ?? Uint8Array.from([]))
    }
  }

  const onLeave = () => {
    const array = Array.apply(null, Array(80)).map((v,i) => false)
    setSelectionArray(array)
  }

  return (
    <VStack>
      <SimpleGrid columns={16} onMouseLeave={e => onLeave()}>
        {hexArray.map((v, i) => <Octet index={i} hex={v} selected={!!selectionArray? selectionArray[i]: false} onHover={onHover} key={i}/>)}
      </SimpleGrid>
      <Center>
        <HexOnelineView title={label} hex={selectedBytes} size={68} copy={copy} titleLength={20}/>
      </Center>
    </VStack>
  )
}