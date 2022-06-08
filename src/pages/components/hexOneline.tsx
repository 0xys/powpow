import { Box, VStack, HStack, Input, Button, Divider, Heading, ButtonGroup, IconButton } from '@chakra-ui/react'
import { AddIcon, CopyIcon } from '@chakra-ui/icons'
import { useMemo } from 'react'
import React from 'react'

export const HexOnelineComponent = React.memo((prop: {
    title: string,
    hex?: Uint8Array,
    copy: (m: string) => void,
}) => {
    const {title, hex, copy} = prop

    const hexString = useMemo(() => {
        return Buffer.from(hex ?? []).toString('hex')
    }, [hex])

    return (
        <ButtonGroup size='sm' isAttached variant='outline'>
            <Button>{title}</Button>
            <Button>{hexString}</Button>
            <IconButton aria-label='copy' icon={<CopyIcon />} onClick={() => copy(hexString)}/>
        </ButtonGroup>
    )
})