import { Box, VStack, HStack, Input, Button, Divider, Heading, ButtonGroup, IconButton, InputGroup, InputLeftAddon, InputRightElement } from '@chakra-ui/react'
import { AddIcon, CopyIcon } from '@chakra-ui/icons'
import { useMemo } from 'react'
import React from 'react'

export const hexFont = 'Consolas'

const HexOnelineView = React.memo((prop: {
    title: string,
    hex?: Uint8Array,
    size?: number,
    titleLength?: number,
    copy: (m: string) => void,
}) => {
    const { title, hex, copy, size, titleLength } = prop

    const hexString = useMemo(() => {
        return Buffer.from(hex ?? []).toString('hex')
    }, [prop.hex])

    return (
        <InputGroup size='sm' variant='outline'>
            <InputLeftAddon width={`${titleLength ?? 12}ch`} children={title} outline={''}/>
            <Input
                width={`${size ?? hexString.length}ch`}
                fontFamily={hexFont}
                isReadOnly={true}
                variant='filled'
                value={hexString}/>
        </InputGroup>
    )
})

HexOnelineView.displayName = 'HexOnelineView'

export { HexOnelineView }