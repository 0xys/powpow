import { Badge, Box, Button, Center, Divider, Heading, HStack, SimpleGrid, useToast, VStack } from "@chakra-ui/react";
import { toBigIntBE } from "bigint-buffer";
import { useEffect, useMemo, useState } from "react";
import crypto from 'crypto'
import secp256k1 from 'secp256k1'
import { Destination, Transaction } from "../../../types/blockchain/transaction";
import { hexFont, HexOnelineComponent } from "../../components/hex/hexOneline";
import { HexOnelineCannotEdit } from "../../components/hex/hexOnelineConstant";
import { HexOnelineEdit } from "../../components/hex/hexOnelineEditable";
import { HexOnelineView } from "../../components/hex/hexOnelineView";
import text from '../../../texts/transaction.json'
import styles from '../../../styles/Layout.module.css';
import senders from './senders.json'
import { SenderBox } from "./sender";
import { Text } from '@chakra-ui/react'

const txBlobLength = 126
const txWithSigBlobLength = txBlobLength + 65
const defaultFee = 100

const getRandomAddress = (): Buffer => {
  const priv = crypto.randomBytes(32)
  const pubkey = secp256k1.publicKeyCreate(priv, true)
  return Buffer.from(pubkey)
}

const zeroAddress = Buffer.allocUnsafe(33).fill(0)
const defaultDest = new Destination(getRandomAddress(), BigInt(0), Buffer.allocUnsafe(32).fill(0))
const defaultTx = new Transaction(getRandomAddress(), BigInt(0), BigInt(1000), [defaultDest])

const Octet = (prop: {
  index: number,
  hex: string,
  selected: boolean,
  onHover: (index: number) => void,
}) => {
  return (<Center
    width='4ch'
    height='4ch'
    fontFamily={hexFont}
    background={prop.selected ? 'orange.300': 'white'}
    onMouseEnter={(e: any) => prop.onHover(prop.index)}
    >
      {prop.hex}
    </Center>)
}
Octet.displayName = 'Octet'

const OctetSmall = (prop: {
  index: number,
  hex: string,
  color?: string,
}) => {
  return (<Center
    width='2.4ch'
    height='2.4ch'
    fontFamily={hexFont}
    background={'white'}
    color={prop.color ?? 'black'}
    fontSize='2ch'
    >
      {prop.hex}
    </Center>)
}
OctetSmall.displayName = 'OctetSmall'

const SentResult = (prop: {
  signed: boolean,
  verified: boolean,
  tx?: Transaction,
  senderIndex: number,
}) => {
  const {tx, senderIndex, signed, verified} = prop

  if (!signed) {
    return (<>
      <Badge colorScheme='red' variant='solid' fontSize='1.2em'>拒否</Badge>
      <p>トランザクションは署名されていません</p>
    </>)
  }

  const signingKey = Buffer.from(senders[senderIndex].priv, 'hex')
  const signingPubkey = Buffer.from(secp256k1.publicKeyCreate(signingKey, true))

  if (!verified) {
    if (!signingPubkey) {
      return (<>
        <Badge colorScheme='red' variant='solid' fontSize='1.2em'>拒否</Badge>
        <Text>署名されていません</Text>
      </>)
    }
    if (!tx) {
      return (<>
        <Badge colorScheme='red' variant='solid' fontSize='1.2em'>拒否</Badge>
        <Text>トランザクションがありません</Text>
      </>)
    }
    if (!Buffer.from(signingPubkey).equals(tx.getFromAddress())) {
      return (<>
        <Badge colorScheme='red' variant='solid' fontSize='1.2em'>拒否</Badge>
        <Text>無効な署名： 署名主の公開鍵が【From】と一致しません</Text>
      </>)
    }
    return (<>
      <Badge colorScheme='red' variant='solid' fontSize='1.2em'>拒否</Badge>
      <Text>無効な署名： 現在のトランザクション内容に対する署名ではありません</Text>
    </>)
  }

  if(!tx) {
    return (<>
      <Badge colorScheme='red' variant='solid' fontSize='1.2em'>拒否</Badge>
      <Text>トランザクションが送られていません</Text>
    </>)
  }

  if (tx.getSequence() != BigInt(senders[senderIndex].seq + 1)) {
    return (<>
      <Badge colorScheme='red' variant='solid' fontSize='1.2em'>拒否</Badge>
      <Text>無効なトランザクション： シークエンス番号が不正です</Text>
      <Text>【Sequence】に現在のシークエンス番号＋１の値を入れてください</Text>
    </>)
  }
  if (tx.getDests()[0].getAmount() + BigInt(defaultFee) > BigInt(senders[senderIndex].balance)) {
    return (<>
      <Badge colorScheme='red' variant='solid' fontSize='1.2em'>拒否</Badge>
      <Text>無効なトランザクション： 残高が足りません</Text>
      <Text>【Amount】と【Fee】の合計だけ残高が必要です</Text>
    </>)
  }
  if (tx.fee < BigInt(defaultFee)) {
    return (<>
      <Badge colorScheme='red' variant='solid' fontSize='1.2em'>拒否</Badge>
      <Text>無効なトランザクション： 手数料が安すぎです。</Text>
      <Text>本サイトでは最低手数料を100に固定しています。多くのブロックチェーンでもDDoS対策として最低手数料を設定しています。手数料相場によって変動することもあります。</Text>
    </>)
  }

  return (<>
    <Badge colorScheme='green' variant='solid' fontSize='1.2em'>受理</Badge>
    <p>トランザクションを受け付けました</p>
    <p>{tx.hashString()}</p>
  </>)
}

const SignResult = (prop: {
  signed: boolean,
  verified: boolean,
}) => {
  if (!prop.signed) {
    return (
      <p>トランザクションは署名されていません</p>
    )
  }
  if (prop.signed && prop.verified) {
    return (<>
      <Badge colorScheme='green' variant='solid' fontSize='1.2em'>有効な署名</Badge>
      <p>有効な署名です</p>
    </>)
  }
  return (<>
    <Badge colorScheme='red' variant='solid' fontSize='1.2em'>無効な署名</Badge>
    <p>署名主の公開鍵が【From】と一致しません</p>
  </>)
}

export default function TransactionPage() {
  const [label, setLabel] = useState('')
  const [selectionArray, setSelectionArray] = useState<boolean[]>()
  const [selectedBytes, setSelectedBytes] = useState<Uint8Array>()
  const [tx, setTx] = useState<Transaction>()
  const [txError, setTxError] = useState<number[]>([0,0,0,0,0,0])
  const [senderIndex, setSenderIndex] = useState(0)
  const [signed, setSigned] = useState(false)
  const [sent, setSent] = useState(false)
  const [verified, setVerified] = useState(false)

  const toast = useToast()

  useEffect(() => {
    setTx(defaultTx)
  }, [])

  const onGenKeyPairButtonClicked = () => {
    const next = (senderIndex + 1 ) % senders.length
    setSenderIndex(next)
  }
  const [priv, pubkey] = useMemo(() => {
    const priv = Buffer.from(senders[senderIndex].priv, 'hex')
    return [priv, secp256k1.publicKeyCreate(priv, true)]
  }, [senderIndex])

  const [bytes, hexArray, fullBytes, fullHexArray] = useMemo(() => {
    let bytes: Buffer
    let fullBytes: Buffer
    if (!tx) {
      bytes = Buffer.alloc(txBlobLength).fill(0)
      fullBytes = Buffer.alloc(txWithSigBlobLength).fill(0)
    }else{
      bytes = tx.toSignable()
      fullBytes = tx.encode()
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
    
    const fullHexArray = fullBytes.toJSON()
      .data
      .map(v => {
        if (v < 16) {
          return '0' + v.toString(16)
        }else{
          return v.toString(16)
        }
      })
    setSent(false)
    return [bytes, hexArray, fullBytes, fullHexArray]
  }, [tx])

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
        title: 'Copied!',
        status: 'info',
        duration: 750,
        isClosable: true,
    })
  }
  const copyAsHex = (num: number, len: number) => {
    const hex = num.toString(16).padStart(len, '0')
    navigator.clipboard.writeText(hex)
    toast({
      title: `Copied: ${hex} (original: ${num})`,
      status: 'info',
      duration: 1750,
      isClosable: true,
    })
  }

  const onHover = (index: number) => {
    if (index < 0) {
      const array = Array.apply(null, Array(txBlobLength)).map((v,i) => false)
      setSelectionArray(array)
      return
    }

    if (index < 33) {
      const array = Array.apply(null, Array(txBlobLength)).map((v,i) => i < 33)
      setLabel('from')
      setSelectionArray(array)
      setSelectedBytes(bytes?.slice(0, 33) ?? Uint8Array.from([]))
    } else if (index < 37) {
      const array = Array.apply(null, Array(txBlobLength)).map((v,i) => i >= 33 && i < 37)
      setLabel('sequence')
      setSelectionArray(array)
      setSelectedBytes(bytes?.slice(33, 37) ?? Uint8Array.from([]))
    } else if (index < 45) {
      const array = Array.apply(null, Array(txBlobLength)).map((v,i) => i >= 37 && i < 45)
      setLabel('fee')
      setSelectionArray(array)
      setSelectedBytes(bytes?.slice(37, 45) ?? Uint8Array.from([]))
    } else if (index < 49) {
      const array = Array.apply(null, Array(txBlobLength)).map((v,i) => i >= 45 && i < 49)
      setLabel('len') // dest length
      setSelectionArray(array)
      setSelectedBytes(bytes?.slice(45, 49) ?? Uint8Array.from([]))
    } else if (index < 82) {
      const array = Array.apply(null, Array(txBlobLength)).map((v,i) => i >= 49 && i < 82)
      setLabel('to')
      setSelectionArray(array)
      setSelectedBytes(bytes?.slice(49, 82) ?? Uint8Array.from([]))
    } else if (index < 90) {
      const array = Array.apply(null, Array(txBlobLength)).map((v,i) => i >= 82 && i < 90)
      setLabel('amount')
      setSelectionArray(array)
      setSelectedBytes(bytes?.slice(82, 90) ?? Uint8Array.from([]))
    } else if (index < 94) {
      const array = Array.apply(null, Array(txBlobLength)).map((v,i) => i >= 90 && i < 94)
      setLabel('meslen')  // message length
      setSelectionArray(array)
      setSelectedBytes(bytes?.slice(90, 94) ?? Uint8Array.from([]))
    } else {
      const array = Array.apply(null, Array(txBlobLength)).map((v,i) => i >= 94)
      setLabel('message')
      setSelectionArray(array)
      setSelectedBytes(bytes?.slice(94, 126) ?? Uint8Array.from([]))
    }
  }

  const onLeave = () => {
    const array = Array.apply(null, Array(txBlobLength)).map((v,i) => false)
    setSelectionArray(array)
    setLabel('')
  }

  const setFrom = (from: Buffer) => {
    if (!tx) {
      return
    }
    tx.setFromAddress(from)
    setTx({...tx})
  }
  const setSequence = (seq: Buffer) => {
    if (!tx) {
      return
    }
    tx.setSequence(seq)
    setTx({...tx})
  }
  const setTo = (to: Buffer) => {
    if (!tx) {
      return
    }
    const dests = tx.getDests()
    if (dests.length == 0) {
      tx.setDests([new Destination(to, BigInt(0))])
    } else {
      tx.setDests([new Destination(to, tx.dests[0].getAmount(), tx.dests[0].getMessage())])
    }
    setTx({...tx})
  }
  const setAmount = (amount: Buffer) => {
    if (!tx) {
      return
    }
    const dests = tx.getDests()
    if (dests.length == 0) {
      const amountBigInt = toBigIntBE(amount)
      tx.setDests([new Destination(zeroAddress, amountBigInt)])
    } else {
      const amountBigInt = toBigIntBE(amount)
      tx.setDests([new Destination(tx.dests[0].getAddress(), amountBigInt, tx.dests[0].getMessage())])
    }
    setTx({...tx})
  }
  const setMessage = (message: Buffer) => {
    if (!tx) {
      return
    }
    const dests = tx.getDests()
    if (dests.length == 0) {
      tx.setDests([new Destination(zeroAddress, BigInt(0), message)])
    } else {
      tx.setDests([new Destination(tx.dests[0].getAddress(), tx.dests[0].getAmount(), message)])
    }
    setTx({...tx})
  }

  const setFee = (fee: Buffer) => {
    if (!tx) {
      return
    }
    tx.setFee(fee)
    setTx({...tx})
  }
  const hash = useMemo(() => {
    return tx?.hash()
  }, [tx])
  
  const setSignature = (sig: Buffer) => {
    if (!tx) {
      return
    }
    tx.setSignature(sig)
    setTx({...tx})
  }
  
  const onSignButtonClicked = () => {
    if (!tx) {
      return
    }
    tx.sign(priv)
    setTx({...tx})
    setSigned(true)
    const verified = tx.verify()
    setVerified(verified)
  }

  const onSendButtonClicked = () => {
    if (!tx) {
      return
    }
    setSent(true)
    const verified = tx.verify()
    setVerified(verified)
  }

  const onError = (index: number) => (anyError: boolean) => {
    if (anyError) {
      txError[index] = 1
      setTxError([... txError])
    }else{
      txError[index] = 0
      setTxError([... txError])
    }
  }

  const onResetButtonClicked = () => {
    setTx(defaultTx)
    setSenderIndex(0)
    setSigned(false)
    setSent(false)
    setVerified(false)
  }

  return (<VStack>
      <VStack className={styles.block}>
        <Heading>
          トランザクション
        </Heading>
        <Text>{text.transaction}</Text>
        <HexOnelineEdit title='From' titleLength={12} hex={tx?.getFromAddress()} byteLength={33} hexLength={70} setValue={setFrom} focused={label=='from'} anyError={onError(0)}/>
        <HexOnelineEdit title='Sequence' titleLength={12} hex={tx?.getSequenceBuffer()} byteLength={4} hexLength={70} setValue={setSequence} focused={label=='sequence'} anyError={onError(3)}/>
        <HexOnelineEdit title='Fee' titleLength={12} hex={tx?.getFeeBuffer()} byteLength={8} hexLength={70} setValue={setFee} focused={label=='fee'} anyError={onError(2)}/>
        <HexOnelineEdit title='To' titleLength={12} hex={tx?.getDests()[0]?.getAddress()} byteLength={33} hexLength={70} setValue={setTo} focused={label=='to'} anyError={onError(1)}/>
        <HexOnelineEdit title='Amount' titleLength={12} hex={tx?.getDests()[0]?.getAmountBuffer()} byteLength={8} hexLength={70} setValue={setAmount} focused={label=='amount'} anyError={onError(1)}/>
        <HexOnelineEdit title='Message' titleLength={12} hex={tx?.getDests()[0]?.getMessage()} byteLength={32} hexLength={70} setValue={setMessage} focused={label=='message'} anyError={onError(1)}/>
        <SimpleGrid columns={16} onMouseLeave={e => onLeave()}>
          {hexArray.map((v, i) => <Octet index={i} hex={v} selected={!!selectionArray? selectionArray[i]: false} onHover={onHover} key={i}/>)}
        </SimpleGrid>
        <Center>
          <HexOnelineView title={'Transaction Hash'} hex={hash} size={70} copy={copy} titleLength={20}/>
        </Center>
      </VStack>
      <VStack className={styles.toolblock}>
        <Heading>
            署名者
        </Heading>
        <Text>{text.signer}</Text>
        <SenderBox name={senders[senderIndex].name} balance={senders[senderIndex].balance} seq={senders[senderIndex].seq} priv={priv} pub={Buffer.from(pubkey)} onSwitch={onGenKeyPairButtonClicked} onCopy={copyAsHex}/>
        <VStack align={'start'}>
          <HexOnelineComponent title='秘密鍵' hex={priv} copy={copy}/>
          <HexOnelineComponent title='公開鍵' hex={pubkey} copy={copy}/>
        </VStack>
        <Button colorScheme='teal' onClick={onSignButtonClicked}>トランザクションを署名</Button>
        <SignResult signed={signed} verified={verified}/>
      </VStack>
      <VStack className={styles.toolblock}>
        <Heading>
            トランザクション送信者
        </Heading>
        <Text>{text.sender}</Text>
        <SimpleGrid columns={16}>
          {signed ? fullHexArray.map((v, i) => <OctetSmall index={i} hex={v} color={i >= txBlobLength ? 'blue.500': 'orange.500'} key={i}/>):hexArray.map((v, i) => <OctetSmall index={i} hex={v} color='orange.500' key={i}/>)}
        </SimpleGrid>
        <Button onClick={onSendButtonClicked} colorScheme={'blue'}>
          トランザクションを送信
        </Button>
      </VStack>
      <VStack className={styles.toolblock}>
        <Heading>
          検証者（ノード運営者）
        </Heading>
        <Box>
          <VStack align={'baseline'}>
            <Text>ブロックチェーンのノードはインターネットから受け付けるトランザクションを検証して、有効なトランザクションのみを未採掘ブロックに追加するトランザクション候補にします。</Text>
            <Text>検証する項目はブロックチェーンによって異なりますが、概ね以下のような項目をチェックしています。</Text>
            <Text fontWeight={'bold'}>①署名の有効性</Text>
            <Text fontWeight={'bold'}>②残高が足りているか</Text>
            <Text fontWeight={'bold'}>③シークエンス番号は+1されているか</Text>
            <Text fontWeight={'bold'}>④手数料は十分か</Text>
          </VStack>
        </Box>
        <Divider />

        {sent ? <SentResult signed={signed} verified={verified} tx={tx} senderIndex={senderIndex}/>: <p>トランザクションが送信されていません</p>}
      </VStack>
      <VStack>
        <Button onClick={onResetButtonClicked} backgroundColor={'red.500'} color={'white'}>リセット</Button>
      </VStack>
    </VStack>)
}