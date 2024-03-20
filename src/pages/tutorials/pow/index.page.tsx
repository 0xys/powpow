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


const defaultBlockVersion = BigInt(1)
const defaultBlockHash = crypto.randomBytes(32)
const defaultPrevBlockHeight = BigInt(10000)
const defaultPrevBlockHash = Buffer.from('00f355da97f826716da272d4f35ca2b4d24ed28d315656684cb18f6f9481f247', 'hex')
const defaultMerkleRoot = crypto.randomBytes(32)
const defaultDifficulty = BigInt(0x000000ff)
const defaultBlockHeader = new BlockHeader(defaultBlockVersion, BigInt(0), defaultPrevBlockHash, defaultMerkleRoot, BigInt(0), defaultDifficulty)

type MiningStatus = 'not_ready' | 'ready' | 'mining' | 'mined'

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
    >{prop.hex}</Center>)
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
  const [blockHash, setBlockHash] = React.useState<Buffer>()
  const [miningSuccess, setMiningStatus] = React.useState(false)

  useEffect(() => {
    setBlockHash(defaultBlockHash)
  }, [])

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

  const target = useMemo(() => {
    return getWorkTarget(difficulty)
  }, [difficulty])

  const [targetBE, targetLE] = useMemo(() => {
    // targetはすでにリトルエンディアンになっているので、そのままBEに変換したものがLEになる
    return [toBufferLE(target, 4).toString('hex'), toBufferBE(target, 4).toString('hex')]
  }, [target])

  useEffect(() => {
    if(!blockHash) {
      return
    }
    setMiningStatus(mined(blockHash.slice(0,4), toBufferBE(target, 4)))
  }, [blockHash, target, sliderValue])

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
        <Text fontFamily={'Courier'}>ターゲット：0x{targetBE}</Text>
        <Text fontFamily={'Courier'}>ターゲット（リトルエンディアン）：0x{targetLE}</Text>
        <Text fontFamily={'Courier'}>ブロックハッシュが 0x0000000000... 〜 0x{targetLE}ff... の間ならマイニング成功</Text>
      </VStack>
      <VStack>
        <Text fontWeight={'bold'}>試してみよう</Text>
        <HexOnelineEdit title='ブロックハッシュ' hex={blockHash} byteLength={32} hexLength={66} setValue={setBlockHash} focused={false} anyError={() => {}}/>
        <Text fontFamily={'Courier'}>ターゲットのリトルエンディアンが{targetLE}</Text>
        <Text fontFamily={'Courier'}>ブロックハッシュの先頭４バイトが{blockHash?.slice(0,4).toString('hex')}</Text>
        <Text color={miningSuccess?'green.600':'red.400'} fontWeight={'bold'}>マイニング{miningSuccess?'成功':'失敗'}</Text>
      </VStack>
    </VStack>
  )
}

DifficultyPanel.displayName = 'DifficultyPanel'

enum BlockStatus {
  Unknown = -1,
  OK = 0,
  VersionError = 1,
  HeightError = 2,
  PrevBlockHashError = 3,
  MerkleRootError = 4,
  DifficultyError = 5,
  NonceError = 6,
}

const getBlockStatusText = (status: BlockStatus): string => {
  switch (status) {
    case BlockStatus.OK:
      return 'あなたの採掘したブロックが承認されました'
    case BlockStatus.VersionError:
      return 'Versionが間違っています'
    case BlockStatus.HeightError:
      return 'Heightが間違っています'
    case BlockStatus.PrevBlockHashError:
      return 'Prev Block Hashが末端のブロックのハッシュと等しくない値です'
    case BlockStatus.MerkleRootError:
      return 'Merkle Rootが間違っています'
    case BlockStatus.DifficultyError:
      return 'Difficultyが間違っています'
    case BlockStatus.NonceError:
      return 'Nonceが間違っています'
  }
    return 'Unknown'
}

const BlockSentResult = (prop: {
  header?: BlockHeader,
  onStatusChanged: (status: BlockStatus) => void
}) => {
  const { header, onStatusChanged } = prop

  const isVersionValid = useMemo(() => {
    return header?.getVersion() == defaultBlockVersion
  }, [header])

  const isHeightValid = useMemo(() => {
    return header?.getHeight() == defaultPrevBlockHeight + BigInt(1)
  }, [header])

  const isPrevBlockHashValid = useMemo(() => {
    return header?.getPrevBlockHash().equals(defaultPrevBlockHash)
  }, [header])

  // const isMerkleRootValid = useMemo(() => {
  //   return header.getMerkleRoot().equals(defaultMerkleRoot)
  // }, [header])

  const isDifficultyValid = useMemo(() => {
    return header?.getDifficulty() == defaultDifficulty
  }, [header])

  const isNonceValid = useMemo(() => {
    if (!header) {
      return false
    }
    return checkIfMined(header)
  }, [header])


  const status = useMemo(() => {
    if (!isVersionValid) {
      return BlockStatus.VersionError
    }
    if (!isHeightValid) {
      return BlockStatus.HeightError
    }
    if (!isPrevBlockHashValid) {
      return BlockStatus.PrevBlockHashError
    }
    if (!isDifficultyValid) {
      return BlockStatus.DifficultyError
    }
    if (!isNonceValid) {
      return BlockStatus.NonceError
    }
    return BlockStatus.OK
  }, [isVersionValid, isHeightValid, isPrevBlockHashValid, isDifficultyValid, isNonceValid])

  useEffect(() => {
    onStatusChanged(status)
  }, [status])

  return (<VStack>
    <Badge colorScheme={status == BlockStatus.OK ? 'green': 'red'} variant='solid' fontSize='1.2em'>{status == BlockStatus.OK ? 'マイニング承認':'拒否'}</Badge>
    <Text>{getBlockStatusText(status)}</Text>
  </VStack>)
}

BlockSentResult.displayName = 'BlockSentResult'

export default function Pow() {
  const [selectionArray, setSelectionArray] = useState<boolean[]>()
  const [label, setLabel] = useState('')
  const [selectedBytes, setSelectedBytes] = useState<Uint8Array>()
  const [blockHeader, setBlockHeader] = useState<BlockHeader>()
  const [miningStatus, setMiningStatus] = useState<MiningStatus>('not_ready')
  const [headerError, setHeaderError] = useState<number[]>([0,0,0,0,0,0])
  const [isBlockSent, setIsBlockSent] = useState(false)
  const [blockSubmitStatus, setBlockSubmitStatus] = useState<BlockStatus>(BlockStatus.Unknown)

  const toast = useToast()

  // to avoid Hydration errors at Octet grid: https://nextjs.org/docs/messages/react-hydration-error
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

  const onSubmitBlockButtonClicked = () => {
    if (!blockHeader) {
      return
    }
    setIsBlockSent(true)
  }

  const onStatusChanged = (status: BlockStatus) => {
    setBlockSubmitStatus(status)
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
          {hexArray.map((v, i) => <Octet index={i} hex={v} selected={!!selectionArray ? selectionArray[i]: false} onHover={onHover} key={i}/>)}
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
        <VStack alignItems={'start'}>
          <Text fontFamily={'Courier'}>Version: {text.version}</Text>
          <Text fontFamily={'Courier'}>Prev Block Hash: {text.prev_block_hash}</Text>
          <Text fontFamily={'Courier'}>Difficulty: {text.difficulty}</Text>
          <Text fontFamily={'Courier'}>Merkle Root: {text.merkle_root}</Text>
          <Text fontFamily={'Courier'}>Nonce: {text.nonce}</Text>
          <Text fontFamily={'Courier'}>Block Hash: {text.block_hash}</Text>
        </VStack>
        <Text fontSize='xl' fontWeight='bold'>⛏️ マイナー</Text>
        <VStack alignItems={'start'}>
          <Text fontFamily={'Courier'}>{text.mining}</Text>
          <Text fontFamily={'Courier'}>(*1): 例えば0x123456というバイト列なら0x563412というように毎バイトごとに区切って後ろから並べる方式</Text>
        </VStack>
        <Button onClick={onSubmitBlockButtonClicked} colorScheme={'blue'}>
          P2Pネットワークにブロックを送信
        </Button>
      </VStack>
      <VStack className={styles.toolblock}>
        <Heading size='md'>【参考】難易度目安</Heading>
        <DifficultyPanel index={0}/>
      </VStack>
      <VStack className={styles.toolblock}>
        <Heading>🌐 P2Pネットワーク</Heading>
        <VStack alignItems={'start'}>
          <Text>P2Pネットワーク内のすべてのノードは他のノードが送ってきたブロックを検証して、有効なブロックのみを末端のブロックに繋げます。</Text>
          <Text>検証する項目はブロックチェーンによって異なりますが、概ね以下のような項目をチェックしています。</Text>
          <Text>①ブロックヘッダのVersionは今のバージョンに等しいか</Text>
          <Text>②ブロックヘッダのHeightが末端のブロックの高さに+1した値になっているか</Text>
          <Text>③ブロックヘッダのPrevBlockHashが末端のブロックハッシュに等しいか</Text>
          <Text>④ブロックヘッダのMerkle Rootがブロックボディのマークルルートに等しいか</Text>
          <Text>⑤ブロックボディ内のトランザクションに無効なトランザクションがないか</Text>
          <Text>⑥ブロックヘッダのDifficultyが現在の難易度水準として有効かどうか(*1)</Text>
          <Text>⑦ブロックハッシュがマイニング条件を満たしているか</Text>
        </VStack>
        <Divider />
        <Heading size='md'>現在の末端のブロックの状態</Heading>
        <VStack alignItems={'start'}>
          <Text fontFamily='Courier'>バージョン: {defaultBlockVersion.toString()}</Text>

          <Text fontFamily='Courier' as={blockSubmitStatus == BlockStatus.OK ? 's': 'p'}>
            高さ: {defaultPrevBlockHeight.toString()}
          </Text>
          {blockSubmitStatus == BlockStatus.OK ?
            <Text fontFamily='Courier' fontWeight={'bold'} color={'green'}>
              高さ：{blockHeader?.getHeight().toString(10)}
            </Text>:<></>
          }

          <Text fontFamily='Courier' as={blockSubmitStatus == BlockStatus.OK ? 's': 'p'}>
            ブロックハッシュ: {defaultPrevBlockHash.toString('hex')}
          </Text>
          {blockSubmitStatus == BlockStatus.OK ?
            <Text fontFamily='Courier' fontWeight={'bold'} color={'green'}>
              ブロックハッシュ: {blockHeader?.hash().toString('hex')}
            </Text>:<></>
          }
          
          <Text fontFamily='Courier'>難易度: 0x000000{defaultDifficulty.toString(16)}</Text>
        </VStack>
        <Divider />
        {isBlockSent ? <BlockSentResult header={blockHeader} onStatusChanged={onStatusChanged} /> : <Text>まだ新しいブロックが発見されていません</Text>}
      </VStack>
    </VStack>)
}

const checkIfMined = (blockHeader: BlockHeader): boolean => {
  const work = toBigIntBE(blockHeader.hash().slice(0, 4))
  const target = getWorkTargetFromHeader(blockHeader)
  return minedBigInt(work, target)
}

/**
 * 
 * @param work big-endian
 * @param target big-endian
 * @returns 
 */
const mined = (work: Buffer, target: Buffer): boolean => {
  return minedBigInt(toBigIntBE(work), toBigIntBE(target))
}

/**
 * 
 * @param work 
 * @param target 
 * @returns 
 */
const minedBigInt = (work: bigint, target: bigint): boolean => {
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
  const le = toBufferLE(EasiestTarget - difficulty, 4)
  return toBigIntBE(le)
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
