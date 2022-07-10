import { HStack, Input, InputGroup, InputLeftAddon, Text } from "@chakra-ui/react"
import React, { useMemo, useState } from "react"
import { hexFont } from "./hexOneline"

export const HexOnelineEdit = React.memo((prop: {
    title: string,
    hex?: Uint8Array,
    byteLength: number,
    hexLength?: number,
    titleLength?: number,
    focused: boolean,
    setValue: (buf: Buffer) => void,
    anyError: (exist: boolean) => void,
  }) => {
    const { title, hex, hexLength, titleLength } = prop
  
    const [err, setErr] = useState('')
  
    const hexString = useMemo(() => {
        return Buffer.from(prop.hex ?? []).toString('hex')
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
        prop.anyError(false)
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
        prop.anyError(true)
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
  
  HexOnelineEdit.displayName = 'HexOnelineEdit'