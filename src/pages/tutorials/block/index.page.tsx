import { CopyIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import { HStack, IconButton, Input, Image, Text, InputGroup, InputLeftAddon, Tooltip, VStack, TableContainer, Table, Thead, Tr, Th, Tbody, Td, Divider, Heading, Box, Button, Badge, StackDivider, Center, Link } from "@chakra-ui/react";
import { toBigIntBE, toBufferBE } from "bigint-buffer";
import { useCallback, useEffect, useMemo, useState } from "react";
import { hexFont } from "../../components/hex/hexOneline";
import styles from '../../../styles/Layout.module.css';
import { Destination, Transaction } from "../../../types/blockchain/transaction";
import crypto from 'crypto'
import secp256k1 from 'secp256k1'
import { HexOnelineView } from "../../components/hex/hexOnelineView";
import { merkle } from "../../../services/merkle";

const blockSize = 10
const mempoolSize = 200

const TransactionView = (prop: {
  tx: Transaction,
}) => {
  const tx = prop.tx
  const from = '0x' + tx.getFromAddressString().slice(0,12) + '...'
  let to = ''
  let amount = ''
  if (tx.dests.length > 0) {
    to = '0x' + tx.getDests()[0].getAddressString().slice(0,12) + '...'
    amount = tx.getDests()[0].getAmount().toString()
  }
  const fee = tx.getFee().toString()
  return (<Text fontSize={'xs'} fontFamily={'Courier'}>{`${from} ► ${to} ${amount} POW sent with Fee ${fee}`}</Text>)
}

TransactionView.displayName = 'TransactionView'

const getRandomInt = (max: number): number => {
  return Math.floor(Math.random() * max);
}

export default function BlockPage() {
  // merkle tree
  // mempool
  // p2p
  // coinbase
  const [isOpened, setIsOpened] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [sortedTransactions, setSortedTransactions] = useState<Transaction[]>([])

  const onOpenButtonClicked = () => {
    setIsOpened(!isOpened)
  }
  const nodeImageSrc = useMemo(() => {
    if (isOpened) {
      return '/img/node/node2.png'
    } else {
      return '/img/node/node1.png'
    }
  }, [isOpened])

  useEffect(() => {
    if (!isOpened) {
      return
    }
    const receive = async () => {
      const priv = crypto.randomBytes(32)
      const pub = secp256k1.publicKeyCreate(priv, true)
      const seq = getRandomInt(100000)
      const fee = 100 + getRandomInt(200) * 10
      const amount = getRandomInt(10000)
      const priv2 = crypto.randomBytes(32)
      const pub2 = secp256k1.publicKeyCreate(priv2, true)
      const tx = new Transaction(Buffer.from(pub), BigInt(seq), BigInt(fee), [new Destination(Buffer.from(pub2), BigInt(amount))])

      const waitTime = getRandomInt(5)
      await new Promise(resolve => setTimeout(resolve, 400*waitTime))
      if (transactions.length > mempoolSize) {
        setTransactions([tx, ...transactions.slice(0, mempoolSize - 1)])
      } else {
        setTransactions([tx, ...transactions])
      }
    }
    receive()
  },[transactions, isOpened])

  useEffect(() => {
    if (!isOpened) {
      return
    }
    const sort = () => {
      const original = [...transactions]
      const sorted = original.sort((a, b) => {
        return Number(b.getFee()) - Number(a.getFee())
      })
      setSortedTransactions(sorted)
    }
    sort()
  }, [transactions, isOpened])

  const [blockTransactions, sumFee, merkleRoot] = useMemo<[Transaction[], BigInt, Buffer]>(() => {
    let mr = Buffer.alloc(32)
    const original = [...sortedTransactions]
    const block = original.slice(0, Math.min(original.length, blockSize))
    const sum = block.reduce((acc, tx) => acc + tx.getFee(), BigInt(0))
    if (block.length > 0) {
      mr = merkle(block.map(x => x.hash()))
    }
    return [block, sum, mr]
  }, [sortedTransactions])

  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied!',
      status: 'info',
      duration: 750,
      isClosable: true,
    })
  }, [])

  const onResetButtonClicked = () => {
    setTransactions([])
    setSortedTransactions([])
    setIsOpened(false)
  }

  return (
    <VStack>
      <VStack className={styles.block}>
        <Heading>
          ノード
        </Heading>
        <Text>ノードを世界に向けて公開してみましょう</Text>
        <Image src={nodeImageSrc} alt='node' />
        <Button colorScheme='teal' onClick={onOpenButtonClicked}>{!isOpened ? "ノードをインターネットに公開" : "ノードを非公開にする"}</Button>
        {isOpened && (
          <VStack align={'baseline'}>
            <Text>ノードは他のノードを探し、近隣ノードと接続関係を結びます</Text>
            <Text>ノードは近隣ノードからトランザクションを知らされます（ゴシッププロトコル）</Text>
            <Text>ノードはユーザーからトランザクションを受け付けます</Text>
          </VStack>
        )}
      </VStack>
      <VStack className={styles.toolblock}>
        <HStack>
          <Heading>
          メモリープール
          </Heading>
          {isOpened ? <Badge colorScheme='green' variant='outline' fontSize='1.2em'>受付中</Badge> : <Badge colorScheme='red' variant='outline' fontSize='1.2em'>受付停止中</Badge>}
        </HStack>
        
        <VStack>
          <VStack alignItems={'start'}>
            <Text>ノードは集まったトランザクションを検証し、受け付けるかどうか判定します。</Text>
            <Text>無事、検証に通ったトランザクションをメモリープールと呼ばれる領域に一時的に保持します</Text>
            <Text>メモリープールには容量があります。今回は{mempoolSize}トランザクションです。実際のブロックチェーンではバイト単位で決まっています。</Text>
          </VStack>
          <HStack alignItems='start' divider={<StackDivider borderColor='gray.200' />}>
            <VStack>
              {transactions.slice(0, Math.min(transactions.length, 14)).map((tx, i) => (
                <TransactionView tx={tx} key={i} />
              ))}
            </VStack>
            <VStack>
              {transactions.length > 14 ? transactions.slice(14, Math.min(transactions.length, 28)).map((tx, i) => (
                <TransactionView tx={tx} key={i} />
              )) : <></>}
            </VStack>
          </HStack>
          <Text align={'center'}>{`${transactions.length}/${mempoolSize}`}</Text>
        </VStack>
      </VStack>

      <VStack className={styles.toolblock}>
        <HStack>
          <Heading>
          ブロックボディ生成
          </Heading>
          {isOpened ? <Badge colorScheme='green' variant='outline' fontSize='1.2em'>生成中</Badge> : <Badge colorScheme='red' variant='outline' fontSize='1.2em'>生成停止中</Badge>}
        </HStack>
        <VStack>
          <VStack alignItems={'start'}>
            <Text>ノードはブロック容量が許す限り、メモリープールのトランザクションをブロックに入れることができます。</Text>
            <Text>合理的なノードはトランザクションの手数料が高い順に選んでいきます。</Text>
            <Text>今回はブロック容量が{blockSize}トランザクションということにしましょう。実際のブロックチェーンでは大抵バイト単位で決まっています。</Text>
          </VStack>
          
          {blockTransactions.map((tx, i) => (
            <TransactionView tx={tx} key={i} />
          ))}
          <Text align={'center'}>{`手数料収入合計： ${sumFee} POW`}</Text>
          <Center>
            <HexOnelineView title={'マークルルート'} hex={merkleRoot} size={70} copy={copy} titleLength={20}/>
          </Center>
          <Link href='https://gaiax-blockchain.com/merkle-tree' color='teal.500' isExternal>
            マークルルートについて詳しく <ExternalLinkIcon mx='2px' />
          </Link>
        </VStack>
      </VStack>
      <Button onClick={onResetButtonClicked} backgroundColor={'red.500'} color={'white'}>リセット</Button>
    </VStack>)
}
function toast(arg0: { title: string; status: string; duration: number; isClosable: boolean; }) {
  throw new Error("Function not implemented.");
}

