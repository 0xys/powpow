import { Center, Heading, SimpleGrid, useToast, VStack } from "@chakra-ui/react";
import { toBigIntBE } from "bigint-buffer";
import { useEffect, useMemo, useState } from "react";
import crypto from 'crypto'
import secp256k1 from 'secp256k1'
import { Destination, Transaction } from "../../../types/blockchain/transaction";
import { hexFont } from "../../components/hex/hexOneline";
import { HexOnelineCannotEdit } from "../../components/hex/hexOnelineConstant";
import { HexOnelineEdit } from "../../components/hex/hexOnelineEditable";
import { HexOnelineView } from "../../components/hex/hexOnelineView";
import styles from '../../../styles/Layout.module.css';

const txBlobLength = 126


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
  onHover: (index: number) => void
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

export default function TransactionPage() {
  const [label, setLabel] = useState('')
  const [selectionArray, setSelectionArray] = useState<boolean[]>()
  const [selectedBytes, setSelectedBytes] = useState<Uint8Array>()
  const [tx, setTx] = useState<Transaction>()
  const [txError, setTxError] = useState<number[]>([0,0,0,0,0,0])

  const toast = useToast()

  useEffect(() => {
    setTx(defaultTx)
  }, [])

  const [bytes, hexArray] = useMemo(() => {
    let bytes: Buffer
    if (!tx) {
      bytes = Buffer.alloc(txBlobLength).fill(0)
    }else{
      bytes = tx.toSignable()
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
  const setSignature = (sig: Buffer) => {
    if (!tx) {
      return
    }
    tx.setSignature(sig)
    setTx({...tx})
  }

  const hash = useMemo(() => {
    return tx?.hash()
  }, [tx])

  const onError = (index: number) => (anyError: boolean) => {
    if (anyError) {
      txError[index] = 1
      setTxError([... txError])
    }else{
      txError[index] = 0
      setTxError([... txError])
    }
  }

  return (
    <VStack className={styles.block}>
      <Heading>
        トランザクション
      </Heading>
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
  )
}