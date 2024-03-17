import { Box, VStack, HStack, Input, Text, Button, Divider, Heading, ButtonGroup, IconButton, Textarea, InputGroup, InputLeftAddon, useToast, Alert, AlertIcon, AlertTitle, SimpleGrid, Center, Badge, SliderFilledTrack, SliderTrack, SliderThumb, Slider, SliderMark, Tag, Icon } from '@chakra-ui/react'
import { AddIcon, CopyIcon, SettingsIcon } from '@chakra-ui/icons'
import { useCallback, useEffect, useMemo, useState } from 'react'
import crypto from 'crypto'
import { createHash } from 'crypto';
import { hexFont } from '../../components/hex/hexOneline';
import { HexOnelineView } from '../../components/hex/hexOnelineView';
import { BlockHeader } from '../../../types/blockchain/blockHeader';
import React from 'react';
import { toBigIntBE, toBigIntLE, toBufferBE, toBufferLE } from 'bigint-buffer';
import styles from '../../../styles/Layout.module.css';

import text from '../../../texts/mining.json'
import { HexOnelineEdit } from '../../components/hex/hexOnelineEditable';
import { HexOnelineCannotEdit } from '../../components/hex/hexOnelineConstant';

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

Octet.displayName = 'Octet'

const CircleIcon = (props: any) => (
  <Icon viewBox='0 0 200 200' {...props}>
    <path
      fill='currentColor'
      d='M 100, 100 m -75, 0 a 75,75 0 1,0 150,0 a 75,75 0 1,0 -150,0'
    />
  </Icon>
)

const defaultSliderValue = 70
const mediumValue = 90
const difficultValue = 170
const moreDifficultValue = 250
const DifficultyPanel = (prop: {
  index: number,
}) => {
  const [sliderValue, setSliderValue] = React.useState(defaultSliderValue)
  const labelStyles = {
    mt: '4',
    ml: '-1',
    fontSize: 'sm',
  }
  const [bg, fg, colorScheme, diffLabel] = useMemo(() => {
    if (sliderValue == 10) {
      return ['blue.100', 'blue.500', 'blue', 'MIN']
    } else if (sliderValue < mediumValue) {
      return ['green.100', 'green.400', 'green', '簡単']
    } else if (sliderValue >= mediumValue && sliderValue < difficultValue) {
      return ['yellow.100', 'yellow.400', 'yellow', '普通']
    } else if (sliderValue >= difficultValue && sliderValue < moreDifficultValue) {
      return ['orange.100', 'orange.400', 'orange', '難しい']
    } else if (sliderValue < 320) {
      return ['red.100', 'red.400', 'red', 'とても難しい']
    } else {
      return ['purple.100', 'purple.500', 'purple', 'MAX']
    }
  }, [sliderValue])

  const difficulty = useMemo(() => {
    const bit = sliderValue/10 // 0-32
    if (bit == 0) {
      return BigInt(0)
    }
    if (bit == 32) {
      return BigInt(0xffffffff) // max
    }
    return BigInt((0x01 << (bit-1)) - 1)
  }, [sliderValue])

  const workTarget = useMemo(() => {
    const workTarget = getWorkTarget(difficulty)
    return workTarget
  }, [difficulty])

  const [hashStart, hashEnd] = useMemo(() => {
    if (workTarget == BigInt(0)) {
      return ['00000000', '00000000']
    }
    return ['00000000', toBufferLE(workTarget, 4).toString('hex'), ]
  }, [workTarget])

  return (
    <VStack alignItems={'start'} spacing={'10'}>
      <Slider defaultValue={defaultSliderValue} min={10} max={320} step={10} width={'2xl'} onChange={setSliderValue}>
        <SliderTrack bg={bg}>
          <SliderFilledTrack bg={fg} />
        </SliderTrack>
        <SliderMark value={mediumValue} {...labelStyles}>
          普通
        </SliderMark>
        <SliderMark value={difficultValue} {...labelStyles}>
          難しい
        </SliderMark>
        <SliderMark value={moreDifficultValue} {...labelStyles}>
          とても難しい
        </SliderMark>
        <SliderThumb boxSize={6}>
          <Box color={fg} as={CircleIcon} />
        </SliderThumb>
      </Slider>
      <VStack alignItems={'start'}>
        <HStack>
          <Text fontFamily={'Courier'}>難易度：0x{toBufferBE(difficulty, 4).toString('hex')}</Text>
          <Tag size={'md'} variant='solid' colorScheme={colorScheme}>{diffLabel}</Tag>
        </HStack>
        <Text fontFamily={'Courier'}>ターゲット：0x{toBufferBE(workTarget, 4).toString('hex')}</Text>
        <Text fontFamily={'Courier'}>ブロックハッシュが 0x{hashStart}00... 〜 0x{hashEnd}ff... の間ならマイニング成功</Text>
      </VStack>
      
    </VStack>
  )
}

Octet.displayName = 'Octet'

const defaultBlockHeader = new BlockHeader(BigInt(1), BigInt(0), crypto.randomBytes(32), crypto.randomBytes(32), BigInt(0))

type MiningStatus = 'not_ready' | 'ready' | 'mining' | 'mined'

export default function Pow() {
  const [selectionArray, setSelectionArray] = useState<boolean[]>()
  const [label, setLabel] = useState('')
  const [selectedBytes, setSelectedBytes] = useState<Uint8Array>()
  const [blockHeader, setBlockHeader] = useState<BlockHeader>()
  const [miningStatus, setMiningStatus] = useState<MiningStatus>('not_ready')
  const [headerError, setHeaderError] = useState<number[]>([0,0,0,0,0,0])

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
    blockHeader.setDifficulty(b)
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
    blockHeader.setNonceBuffer(b)
    setBlockHeader({...blockHeader})
  }

  const hash = useMemo(() => {
    return blockHeader?.hash()
  }, [blockHeader])

  useEffect(() => {
    const mine = async () => {
      if (!blockHeader) {
        return
      }
      let nonce = blockHeader.getNonce()
      nonce = nonce + BigInt(1)
      console.log(miningStatus, nonce, blockHeader.getDifficultyBuffer().toString('hex'))
      blockHeader.setNonce(nonce)

      await new Promise(resolve => setTimeout(resolve, 100))
      setBlockHeader({...blockHeader})      
    }
    if (!blockHeader) {
      return
    }
    if (miningStatus == 'mining') {
      if (checkIfMined(blockHeader)) {
        setMiningStatus('mined')
        return
      }
      mine()
    }
  }, [blockHeader, miningStatus])

  const isMined = useMemo(() => {
    if (!blockHeader) {
      return false
    }
    return checkIfMined(blockHeader)
  }, [blockHeader])

  useEffect(() => {
    if (!blockHeader) {
      return
    }
    if (headerError.every(x => x == 0)) {
      if (checkIfMined(blockHeader)) {
        setMiningStatus('mined')
      }else{
        if(miningStatus == 'mining') {
          return // do nothing
        }else{
          setMiningStatus('ready')
        }
      }
    }else{
      setMiningStatus('not_ready')
    }
  }, [blockHeader, headerError])

  const mineButtonText = useMemo(() => {
    return getMineButtonText(miningStatus)
  }, [miningStatus])

  const onError = (index: number) => (anyError: boolean) => {
    if (anyError) {
      headerError[index] = 1
      setHeaderError([... headerError])
    }else{
      headerError[index] = 0
      setHeaderError([... headerError])
    }
  }

  return (
    <VStack>
      <VStack className={styles.block}>
        <Heading>
          ブロックへッダ
        </Heading>
        <HexOnelineEdit title='Version' hex={blockHeader?.getVersionBuffer()} byteLength={4} hexLength={68} setValue={setVersion} focused={label=='version'} anyError={onError(0)}/>
        <HexOnelineEdit title='Height' hex={blockHeader?.getHeightBuffer()} byteLength={4} hexLength={68} setValue={setHeight} focused={label=='height'} anyError={onError(1)}/>
        <HexOnelineEdit title='Prev Block Hash' hex={blockHeader?.getPrevBlockHash()} byteLength={32} hexLength={68} setValue={setPrevBlockHash} focused={label=='prevBlockHash'} anyError={onError(2)}/>
        <HexOnelineEdit title='Difficulty' hex={blockHeader?.getDifficultyBuffer()} byteLength={4} hexLength={68} setValue={setDifficultyTarget} focused={label=='diffTarget'} anyError={onError(3)}/>
        <HexOnelineEdit title='Merkle Root' hex={blockHeader?.getMerkleRoot()} byteLength={32} hexLength={68} setValue={setMerkleRoot} focused={label=='merkleRoot'} anyError={onError(4)}/>
        {miningStatus == 'mining' ? (
          <HexOnelineCannotEdit title='Nonce' hex={blockHeader?.getNonceBuffer()} hexLength={68} focused={label=='nonce'} />
        ) : (
          <HexOnelineEdit title='Nonce' hex={blockHeader?.getNonceBuffer()} byteLength={4} hexLength={68} setValue={setNonce} focused={label=='nonce'} anyError={onError(5)}/>
        )}
        <SimpleGrid columns={16} onMouseLeave={e => onLeave()}>
          {hexArray.map((v, i) => <Octet index={i} hex={v} selected={!!selectionArray? selectionArray[i]: false} onHover={onHover} key={i}/>)}
        </SimpleGrid>
        <Center>
          <HexOnelineView title={'Block Hash'} hex={hash} size={68} copy={copy} titleLength={20}/>
        </Center>
        <HStack>
          <Button disabled={ miningStatus == 'not_ready' || miningStatus == 'mined' } colorScheme='teal' onClick={() => {
            if(miningStatus == 'ready') {
              setMiningStatus('mining')
            }else if (miningStatus == 'mining'){
              setMiningStatus('ready')  // cancel mining
            }
          }} isLoading={miningStatus=='mining'} loadingText='Mining...' spinnerPlacement='start'>{mineButtonText}</Button>
          {miningStatus == 'mined' ? <Badge colorScheme='green' variant='outline' fontSize='1.2em'>Done</Badge> : <></>}
        </HStack>
        
        <ul>
          <li>Version: {text.version}</li>
          <li>Height: {text.height}</li>
          <li>Prev Block Hash: {text.prev_block_hash}</li>
          <li>Difficulty: {text.difficulty}</li>
          <li>Merkle Root: {text.merkle_root}</li>
          <li>Nonce: {text.nonce}</li>
          <li>Block Hash: {text.block_hash}</li>
        </ul>
        <Text fontSize='xl' fontWeight='bold'>マイニング作業</Text>
        <Text>{text.mining}</Text>
      </VStack>
      <VStack className={styles.toolblock}>
        <Heading>難易度目安</Heading>
        <DifficultyPanel index={0}/>
      </VStack>
    </VStack>
   
  )
}

const checkIfMined = (blockHeader: BlockHeader): boolean => {
  const work = toBigIntBE(blockHeader.hash().slice(0, 4))
  const targetHex = Buffer.from(getWorkTargetFromHeader(blockHeader).toString(16), 'hex')
  const target = toBigIntLE(targetHex)
  return work <= target
}

const getWorkTargetFromHeader = (blockHeader: BlockHeader): bigint => {
  return getWorkTarget(blockHeader.getDifficulty())
}

const MostDifficultTarget = BigInt(0x00000000)
const EasiestTarget = toBigIntBE(Buffer.alloc(4, 0xff))
/**
 * most difficult target: 0x00000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffff
 * easiest target       : 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
 * @param blockHeader 
 */
const getWorkTarget = (difficulty: bigint): bigint => {
  return EasiestTarget - difficulty
}

const getMineButtonText = (miningStatus: MiningStatus): string => {
  switch (miningStatus) {
    case 'not_ready':
      return 'Not Ready'
    case 'ready':
      return "Let's Mine!"
    case 'mining':
      return 'Mining...'
    case 'mined':
      return 'Mined!'
  }
}
