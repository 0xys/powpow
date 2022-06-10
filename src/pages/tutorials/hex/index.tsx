import { CopyIcon } from "@chakra-ui/icons";
import { HStack, IconButton, Input, InputGroup, InputLeftAddon, Tooltip, VStack } from "@chakra-ui/react";
import { toBigIntBE, toBufferBE } from "bigint-buffer";
import { useMemo, useState } from "react";
import { hexFont } from "../../components/hex/hexOneline";

export default function HexPage() {
  const [num, setNum] = useState<bigint>(BigInt(0))

  const onEdit = (m: string, dh: HexOrDecimal) => {
    if (dh == 'decimal') {
      setNum(BigInt(m))
    } else {
      const num = toBigIntBE(Buffer.from(m, 'hex'))
      setNum(num)
    }
  }

  const buf = useMemo(() => {
    return toBufferBE(num, 12)
  }, [num])

  return (
    <VStack>
      <DecimalInput data={num} onEdit={onEdit} />
      <HexInput data={buf} onEdit={onEdit} />
    </VStack>
  )
}

type HexOrDecimal = 'decimal' | 'hex'

const DecimalInput = (prop: {
  data: BigInt,
  onEdit: (m: string, dh: HexOrDecimal) => void,
}) => {

  return (
    <HStack>
      <InputGroup size={'sm'}>
        <Tooltip label='10進数'>
          <InputLeftAddon children='10進数' width={'12ch'}/>
        </Tooltip>
        <Input type='number' value={prop.data.toString()} width={'70ch'} fontFamily={hexFont} onChange={e => prop.onEdit(e.target.value, 'decimal')}/>
      </InputGroup>
    </HStack>
  )
}

const HexInput = (prop: {
  data: Buffer,
  onEdit: (m: string, di: HexOrDecimal) => void,
}) => {

  const hex = useMemo(() => {
    return prop.data.toString('hex')
  },[prop.data])

  return (
    <HStack>
      <InputGroup size={'sm'}>
        <Tooltip label='16進数'>
          <InputLeftAddon children='16進数' width={'12ch'}/>
        </Tooltip>
        <Input type='text' value={hex} width={'70ch'} fontFamily={hexFont} onChange={e => prop.onEdit(e.target.value, 'hex')}/>
      </InputGroup>
    </HStack>
  )
}