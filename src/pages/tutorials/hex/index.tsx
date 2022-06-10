import { CopyIcon } from "@chakra-ui/icons";
import { HStack, IconButton, Input, Text, InputGroup, InputLeftAddon, Tooltip, VStack } from "@chakra-ui/react";
import { toBigIntBE, toBufferBE } from "bigint-buffer";
import { useMemo, useState } from "react";
import { hexFont } from "../../components/hex/hexOneline";

const regex = new RegExp(`^(0x)?([0-9A-Fa-f][0-9A-Fa-f])*$`)

const log16 = (n: number) => {
  return Math.log(n)/Math.log(256)
}

export default function HexPage() {
  const [decimalNum, setDecimalNum] = useState<bigint>(BigInt(0))
  const [hexNum, setHexNum] = useState<Buffer>()
  const [err, setErr] = useState('')

  const onEditDecimal = (m: string) => {
    setDecimalNum(BigInt(m))
  }
  const bufStr = useMemo(() => {
    let numOfOctet
    if (decimalNum < 256) {
      numOfOctet = 1
    }else{
      numOfOctet = log16(Number(decimalNum)) + 1
    }
    return toBufferBE(decimalNum, numOfOctet).toString('hex')
  }, [decimalNum])

  const onEditHex = (value: string) => {
    if (regex.test(value)) {
      if(value.startsWith('0x')) {
        setHexNum(Buffer.from(value.substring(2), 'hex'))
      }else{
        setHexNum(Buffer.from(value, 'hex'))
      }
      setErr('')
    }else{
      setErr('not hex')
    }
  }
  const decStr = useMemo(() => {
    if (hexNum) {
      return toBigIntBE(hexNum).toString()
    }else{
      return BigInt(0).toString()
    }
  }, [hexNum])

  return (
    <VStack>
      <DecimalInput onEdit={onEditDecimal} />
      <Text>{bufStr}</Text>
      <HexInput onEdit={onEditHex} />
      <Text>{decStr}</Text>
    </VStack>
  )
}

const DecimalInput = (prop: {
  onEdit: (m: string) => void,
}) => {

  return (
    <HStack>
      <InputGroup size={'sm'}>
        <Tooltip label='10進数'>
          <InputLeftAddon children='10進数' width={'12ch'}/>
        </Tooltip>
        <Input type='number' width={'70ch'} fontFamily={hexFont} onChange={e => prop.onEdit(e.target.value)}/>
      </InputGroup>
    </HStack>
  )
}

const HexInput = (prop: {
  onEdit: (m: string) => void,
}) => {

  return (
    <HStack>
      <InputGroup size={'sm'}>
        <Tooltip label='16進数'>
          <InputLeftAddon children='16進数' width={'12ch'}/>
        </Tooltip>
        <Input type='text' width={'70ch'} fontFamily={hexFont} onChange={e => prop.onEdit(e.target.value)}/>
      </InputGroup>
    </HStack>
  )
}