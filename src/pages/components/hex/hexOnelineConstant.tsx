import { HStack, Input, InputGroup, InputLeftAddon } from "@chakra-ui/react"
import React, { useMemo } from "react"
import { hexFont } from "./hexOneline"

export const HexOnelineCannotEdit = React.memo((prop: {
  title: string,
  hex?: Uint8Array,
  hexLength?: number,
  titleLength?: number,
  focused: boolean,
}) => {
  const { title, hex, hexLength, titleLength } = prop

  const hexString = useMemo(() => {
      return Buffer.from(hex ?? []).toString('hex')
  }, [prop.hex])

  return (
    <HStack>
      <InputGroup size='sm' variant='outline'>
        <InputLeftAddon width={`${titleLength ?? 20}ch`} children={title} fontWeight={prop.focused?'extrabold':'normal'} />
        <Input
          width={`${hexLength ?? hexString.length}ch`}
          fontFamily={hexFont}
          variant='filled'
          value={hexString}
          isReadOnly={true}
          />
      </InputGroup>
    </HStack>
  )
})

HexOnelineCannotEdit.displayName = 'HexOnelineCannotEdit'