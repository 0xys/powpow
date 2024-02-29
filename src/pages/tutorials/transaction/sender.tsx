import { Button, ButtonGroup, HStack, IconButton, Input, InputGroup, InputLeftAddon, VStack } from "@chakra-ui/react"
import React, { useMemo } from "react"
import { hexFont } from "../../components/hex/hexOneline"
import { CopyIcon, RepeatIcon } from "@chakra-ui/icons"

export const SenderBox = React.memo((prop: {
  name: string,
  balance: number,
  seq: number,
  priv: Buffer,
  pub: Buffer,
  onSwitch: () => void,
  onCopy: (num: number, len: number) => void,
}) => {
  const { name, balance, seq, priv, pub } = prop

  return (<>
    <VStack>
      <ButtonGroup size='sm' isAttached variant='solid'>
        <Button width={'18ch'}>署名者の名前</Button>
        <Button width={'62ch'} fontFamily={hexFont} >{name}</Button>
        <IconButton aria-label='copy' icon={<RepeatIcon />} onClick={prop.onSwitch} background={'blue.200'}/>
      </ButtonGroup>
      <ButtonGroup size='sm' isAttached variant='outline'>
        <Button width={'18ch'}>残高</Button>
        <Button width={'62ch'} fontFamily={hexFont}>{balance}</Button>
        <IconButton aria-label='copy' icon={<CopyIcon />} onClick={() => {prop.onCopy(balance, 16)}}/>
      </ButtonGroup>
      <ButtonGroup size='sm' isAttached variant='outline'>
        <Button width={'18ch'}>シークエンス番号</Button>
        <Button width={'62ch'} fontFamily={hexFont}>{seq}</Button>
        <IconButton aria-label='copy' icon={<CopyIcon />} onClick={() => {prop.onCopy(seq, 8)}}/>
      </ButtonGroup>
    </VStack>
    </>)
})

SenderBox.displayName = 'SenderBox'