import { Box, VStack, HStack, Input, Text, Button, Divider, Heading, ButtonGroup, IconButton, Textarea, InputGroup, InputLeftAddon, useToast, Alert, AlertIcon, AlertTitle, SimpleGrid, Center } from '@chakra-ui/react'
import { AddIcon, CopyIcon } from '@chakra-ui/icons'
import { useCallback, useEffect, useMemo, useState } from 'react'
import crypto from 'crypto'
import { createHash } from 'crypto';
import { hexFont } from '../../components/hex/hexOneline';
import { HexOnelineView } from '../../components/hex/hexOnelineView';
import { BlockHeader } from '../../../types/blockchain/blockHeader';
import React from 'react';

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

const defaultBlockHeader = new BlockHeader(BigInt(1), BigInt(0), crypto.randomBytes(32), crypto.randomBytes(32), BigInt(0))

export default function Pow() {
  const [selectionArray, setSelectionArray] = useState<boolean[]>()
  const [label, setLabel] = useState('')
  const [selectedBytes, setSelectedBytes] = useState<Uint8Array>()
  const [blockHeader, setBlockHeader] = useState<BlockHeader>()

  const toast = useToast()

  useEffect(() => {
    setBlockHeader(defaultBlockHeader)
  }, [])

  const [bytes, hexArray] = useMemo(() => {
    let bytes: Buffer
    if (!blockHeader) {
      bytes = Buffer.alloc(80).fill(0)
    }else{
      bytes = blockHeader.encode()
    }

    const hexArray = bytes.toJSON()
      .data
      .map(v => {
        if (v < 16) {
          return '0' + v.toString(16)
        }else{
          return v.toString(16)
        }
      })
    return [bytes, hexArray]
  }, [blockHeader])

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
      setLabel('height')
      setSelectionArray(array)
      setSelectedBytes(bytes?.slice(4, 8) ?? Uint8Array.from([]))
    } else if (index < 40) {
      const array = Array.apply(null, Array(80)).map((v,i) => i >= 8 && i < 40)
      setLabel('prevBlockHash')
      setSelectionArray(array)
      setSelectedBytes(bytes?.slice(8, 40) ?? Uint8Array.from([]))
    } else if (index < 44) {
      const array = Array.apply(null, Array(80)).map((v,i) => i >= 40 && i < 44)
      setLabel('diffTarget')
      setSelectionArray(array)
      setSelectedBytes(bytes?.slice(40, 44) ?? Uint8Array.from([]))
    } else if (index < 76) {
      const array = Array.apply(null, Array(80)).map((v,i) => i >= 44 && i < 76)
      setLabel('merkleRoot')
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
    setLabel('')
  }

  const setVersion = (b: Buffer) => {
    if (!blockHeader) {
      return
    }
    blockHeader.setVersion(b)
    setBlockHeader({...blockHeader})
  }
  const setHeight = (b: Buffer) => {
    if (!blockHeader) {
      return
    }
    blockHeader.setHeight(b)
    setBlockHeader({...blockHeader})
  }
  const setPrevBlockHash = (b: Buffer) => {
    if (!blockHeader) {
      return
    }
    blockHeader.setPrevBlockHash(b)
    setBlockHeader({...blockHeader})
  }
  const setDifficultyTarget = (b: Buffer) => {
    if (!blockHeader) {
      return
    }
    blockHeader.setDifficultyTarget(b)
    setBlockHeader({...blockHeader})
  }
  const setMerkleRoot = (b: Buffer) => {
    if (!blockHeader) {
      return
    }
    blockHeader.setMerkleRoot(b)
    setBlockHeader({...blockHeader})
  }
  const setNonce = (b: Buffer) => {
    if (!blockHeader) {
      return
    }
    blockHeader.setNonce(b)
    setBlockHeader({...blockHeader})
  }

  const hash = useMemo(() => {
    return blockHeader?.hash()
  }, [blockHeader])

  return (
    <VStack>
      <HexOnelineEdit title='Version' hex={blockHeader?.getVersionBuffer()} byteLength={4} hexLength={68} setValue={setVersion} focused={label=='version'}/>
      <HexOnelineEdit title='Height' hex={blockHeader?.getHeightBuffer()} byteLength={4} hexLength={68} setValue={setHeight} focused={label=='height'}/>
      <HexOnelineEdit title='Prev Block Hash' hex={blockHeader?.getPrevBlockHash()} byteLength={32} hexLength={68} setValue={setPrevBlockHash} focused={label=='prevBlockHash'}/>
      <HexOnelineEdit title='Difficulty' hex={blockHeader?.getDifficultyTargetBuffer()} byteLength={4} hexLength={68} setValue={setDifficultyTarget} focused={label=='diffTarget'}/>
      <HexOnelineEdit title='Merkle Root' hex={blockHeader?.getMerkleRoot()} byteLength={32} hexLength={68} setValue={setMerkleRoot} focused={label=='merkleRoot'}/>
      <HexOnelineEdit title='Nonce' hex={blockHeader?.getNonceBuffer()} byteLength={4} hexLength={68} setValue={setNonce} focused={label=='nonce'}/>
      <SimpleGrid columns={16} onMouseLeave={e => onLeave()}>
        {hexArray.map((v, i) => <Octet index={i} hex={v} selected={!!selectionArray? selectionArray[i]: false} onHover={onHover} key={i}/>)}
      </SimpleGrid>
      <Center>
        <HexOnelineView title={'Block Hash'} hex={hash} size={68} copy={copy} titleLength={20}/>
      </Center>
    </VStack>
  )
}


const HexOnelineEdit = React.memo((prop: {
  title: string,
  hex?: Uint8Array,
  byteLength: number,
  hexLength?: number,
  titleLength?: number,
  focused: boolean,
  setValue: (buf: Buffer) => void,
}) => {
  const { title, hex, hexLength, titleLength } = prop

  const [err, setErr] = useState('')

  const hexString = useMemo(() => {
      return Buffer.from(hex ?? []).toString('hex')
  }, [prop.hex])

  const regex = useMemo(() => {
    const regex = new RegExp(`^(0x)?([0-9A-Fa-f][0-9A-Fa-f]){${prop.byteLength}}$`)
    return regex
  }, [prop.byteLength])

  const onValueChange = (e: any) => {
    const value: string = e.target.value
    if (regex.test(value)) {
      if(value.startsWith('0x')) {
        prop.setValue(Buffer.from(value.substring(2), 'hex'))
      }else{
        prop.setValue(Buffer.from(value, 'hex'))
      }
      setErr('')
    }else{
      if(value.startsWith('0x')) {
        if(value.length == 2 + 2 * prop.byteLength) {
          setErr('not hex')
        }else{
          setErr('wrong length')
        }
      }else{
        if(value.length == 2 * prop.byteLength) {
          setErr('not hex')
        }else{
          setErr('wrong length')
        }
      }
      prop.setValue(Buffer.alloc(prop.byteLength).fill(0))
    }
  }

  return (
    <HStack>
      <InputGroup size='sm' variant='outline'>
        <InputLeftAddon width={`${titleLength ?? 20}ch`} children={title} fontWeight={prop.focused?'extrabold':'normal'} />
        <Input
          width={`${hexLength ?? hexString.length}ch`}
          fontFamily={hexFont}
          variant='filled'
          defaultValue={hexString}
          onChange={(e) => onValueChange(e)}
          isInvalid={!!err}
          errorBorderColor='crimson'/>
      </InputGroup>
      <Text fontSize='sm' color='tomato' display={err?'block':'none'}>{err}</Text>
    </HStack>
  )
})