import { CopyIcon } from "@chakra-ui/icons";
import { HStack, IconButton, Input, Text, InputGroup, InputLeftAddon, Tooltip, VStack, TableContainer, Table, Thead, Tr, Th, Tbody, Td, Divider, Heading } from "@chakra-ui/react";
import { toBigIntBE, toBufferBE } from "bigint-buffer";
import { useMemo, useState } from "react";
import { hexFont } from "../../components/hex/hexOneline";

const regex = new RegExp(`^(0x)?([0-9A-Fa-f][0-9A-Fa-f])*$`)

const log16 = (n: number) => {
  return Math.log(n)/Math.log(256)
}

const DEC = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]

export default function HexPage() {
  const [decimalNum, setDecimalNum] = useState<bigint>(BigInt(0))
  const [hexNum, setHexNum] = useState<Buffer>()
  const [err, setErr] = useState('')

  const onEditDecimal = (m: string) => {
    setDecimalNum(BigInt(m))
  }
  const bufStr = useMemo(() => {
    if (decimalNum <= 0) {
      return '00'
    }else{
      const numOfOctet = log16(Number(decimalNum)) + 1
      return toBufferBE(decimalNum, numOfOctet).toString('hex')
    }
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
      <Heading>16進数</Heading>
      <Text>
        16進数は数を16種類の文字で表現する。0-9までは既存の数字を使えばいいが、それでは足りなくなる10以降はアルファベットを使う。10進数では10になると繰り上がるように、16進数では16になると桁が増える。0から15までの変換表を下に示した。
      </Text>
      <HStack margin='12px'>
        <DecHexTable array={DEC.slice(0, 4)} colored={true} />
        <DecHexTable array={DEC.slice(4, 8)} colored={false} />
        <DecHexTable array={DEC.slice(8, 12)} colored={true} />
        <DecHexTable array={DEC.slice(12, 16)} colored={false} />
      </HStack>

      <Divider />
      <Text>
        任意の10進数を16進数に変換するツール
      </Text>
      <DecimalInput onEdit={onEditDecimal} />
      <HStack>
        <Text>16進数:</Text>
        <Text>{bufStr}</Text>
      </HStack>

      <Divider />
      <Text>
        任意の16進数を10進数に変換するツール
      </Text>
      <HexInput onEdit={onEditHex} />
      <HStack>
        <Text>10進数:</Text>
        <Text>{decStr}</Text>
      </HStack>
    </VStack>
  )
}

const DecHexTable = (prop: {
  array: number[],
  colored: boolean,
}) => {
  return <TableContainer>
    <Table variant={'simple'} size='sm' backgroundColor={prop.colored ? 'gray.50' : 'white'}>
      <Thead>
        <Tr>
          <Th>10進数</Th>
          <Th>16進数</Th>
        </Tr>
      </Thead>
      <Tbody>
        {prop.array.map(x => {
          return <Tr key={x}>
            <Td>{x}</Td>
            <Td>{x.toString(16)}</Td>
          </Tr>
        })}
      </Tbody>
    </Table>
  </TableContainer>
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