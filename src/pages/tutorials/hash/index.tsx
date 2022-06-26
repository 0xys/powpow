import { CopyIcon } from "@chakra-ui/icons";
import { VStack, Heading, InputGroup, InputLeftAddon, Input, InputRightElement, Button, IconButton, useToast, Center, HStack, Textarea, Tooltip } from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { hexFont } from "../../components/hex/hexOneline";
import { createHash, randomBytes } from 'crypto';
import styles from '../../../styles/Layout.module.css';

export default function HashPage() {
  const [preImage, setPreImage] = useState<string>('')
  const toast = useToast()

  const [image, imageStr] = useMemo(() => {
    const utf8 = Buffer.from(preImage, 'utf8')
    const hashed = createHash('sha256').update(utf8).digest()
    return [hashed, hashed.toString('hex')]
  }, [preImage])

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
        title: 'Copied!',
        status: 'info',
        duration: 750,
        isClosable: true,
    })
  }

  const onPreImageChange = (s: string) => {
    setPreImage(s)
  }

  return (
    <VStack className={styles.block}>
      <Heading>ハッシュ関数</Heading>
      <p>
        ハッシュ関数とは入力に対して一意に定まる出力を返す関数である。その際、出力から入力を逆算することはできない。ハッシュ関数にも様々な種類があり、SHA256というハッシュ関数の場合は出力は32バイトの固定長のハッシュ値が返ってきます。
      </p>
      <Textarea placeholder='ハッシュ前のデータ' onChange={e => onPreImageChange(e.target.value)} resize={'vertical'} width={'70ch'} />
      <HashView data={image} copy={copy} />
      <p>
        "{preImage}"という入力の場合、"{imageStr}"というハッシュ値が返ってきていますね。
      </p>
    </VStack>
  )
}

const HashView = (prop: {
  data: Buffer,
  copy: (m: string) => void,
}) => {

  const hex = useMemo(() => {
    return prop.data.toString('hex')
  },[prop.data])

  return (
    <HStack>
      <InputGroup size={'sm'}>
        <Tooltip label='SHA256のハッシュ値'>
          <InputLeftAddon children='SHA256' width={'12ch'}/>
        </Tooltip>
        <Input type='text' value={hex} readOnly={true} width={'70ch'} fontFamily={hexFont}/>
      </InputGroup>
      <IconButton h='1.75rem' size='sm' onClick={() => prop.copy(hex)} aria-label='copy' icon={<CopyIcon />} />
    </HStack>
  )
}