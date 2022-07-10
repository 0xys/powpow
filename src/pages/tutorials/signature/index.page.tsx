import { Box, VStack, HStack, Input, Button, Divider, Heading, ButtonGroup, IconButton, Textarea, InputGroup, InputLeftAddon, useToast, Alert, AlertIcon, AlertTitle, Text } from '@chakra-ui/react'
import { Image } from '@chakra-ui/react'
import { AddIcon, CopyIcon } from '@chakra-ui/icons'
import { useCallback, useMemo, useState } from 'react'
import crypto from 'crypto'
import { createHash } from 'crypto';
import secp256k1 from 'secp256k1'
import { hexFont, HexOnelineComponent } from '../../components/hex/hexOneline';
import { HexOnelineView } from '../../components/hex/hexOnelineView';

import text from '../../../texts/signature.json'
import styles from '../../../styles/Layout.module.css';

type SignatureVerificationResult = 'empty' | 'valid' | 'invalid'

export default function SignaturePage() {
  const [messageSigned, setMessageSigned] = useState('')
  const [priv, setPrivateKey] = useState<Uint8Array>()
  const [signingKey, setSigningKey] = useState<Buffer>()
  const [signature, setSignature] = useState<Buffer>()
  const [messageVerified, setMessageVerified] = useState('')
  const [verifyingKey, setVerifyingKey] = useState<Buffer>()
  const [sigValidity, setSigValidity] = useState<SignatureVerificationResult>('empty')

  const toast = useToast()

  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied!',
      status: 'info',
      duration: 750,
      isClosable: true,
    })
  }, [])

  const onGenKeyPairButtonClicked = () => {
    const priv = crypto.randomBytes(32)
    setPrivateKey(priv)
  }
  const pubkey = useMemo(() => {
    if (!priv) {
      return
    }
    return secp256k1.publicKeyCreate(priv, true)
  }, [priv])

  const onSigningKeyChanged = (m: string) => {
    if (m.startsWith('0x')) {
      setSigningKey(Buffer.from(m.substring(2), 'hex'))
    }else {
      setSigningKey(Buffer.from(m, 'hex'))
    }
  }
  const onSignedMessageChanged = (m: string) => {
    setMessageSigned(m)
  }
  const [, , signedMessageHashed] = useMemo(() => {
    const utf8 = Buffer.from(messageSigned, 'utf8')
    const hashed = createHash('sha256').update(utf8).digest()
    return [utf8.toString('hex'), hashed.toString('hex'), hashed]
  }, [messageSigned])
  const onSignClicked = () => {
    if (!signingKey) {
      return
    }
    const sig = secp256k1.ecdsaSign(signedMessageHashed, signingKey)
    setSignature(Buffer.from(sig.signature))
  }

  const onVerifingKeyChanged = (m: string) => {
    if (m.startsWith('0x')) {
      setVerifyingKey(Buffer.from(m.substring(2), 'hex'))
    }else {
      setVerifyingKey(Buffer.from(m, 'hex'))
    }
  }
  const onSignatureChanged = (m: string) => {
    if (m.startsWith('0x')) {
      setSignature(Buffer.from(m.substring(2), 'hex'))
    }else {
      setSignature(Buffer.from(m, 'hex'))
    }
  }
  const onVerifiedMessageChanged = (m: string) => {
    setMessageVerified(m)
  }
  const [, , verifiedMessageHashed] = useMemo(() => {
    const utf8 = Buffer.from(messageVerified, 'utf8')
    const hashed = createHash('sha256').update(utf8).digest()
    return [utf8.toString('hex'), hashed.toString('hex'), hashed]
  }, [messageVerified])
  const onVerifyClicked = () => {
    if (!verifyingKey || !signature) {
      return
    }

    const ok = secp256k1.ecdsaVerify(signature, verifiedMessageHashed, verifyingKey)
    setSigValidity(ok ? 'valid' : 'invalid')
  }

  const sigResult = useMemo(() => {
    if (sigValidity == 'empty') {
      return <div></div>
    }
    return (
      <Alert status={sigValidity == 'valid'? 'success':'error'}>
        <AlertIcon />
        <AlertTitle>{sigValidity == 'valid'? 'Valid Signature':'Invalid Signature'}</AlertTitle>
      </Alert>)
  }, [sigValidity])

  return (<VStack>
    <VStack className={styles.block}>
      <Heading>
        電子署名
      </Heading>
      <Text>
        {text[1]}
      </Text>
      <Text>
        {text[2]}
      </Text>
      <Text>
        {text[3]}
      </Text>
      <Text>
        {text[4]}
      </Text>
      <Text>
        {text[5]}
      </Text>
      <Text>
        {text[6]}
      </Text>
      <Text>
        {text[7]}
      </Text>
      <HStack>
        <VStack>
          <Image src='/img/sign/hanko.png' alt='hanko flow' />
          <Text>印鑑を使った署名方法</Text>
        </VStack>
        <Box boxSize={'40'}/>
        <VStack>
          <Image src='/img/sign/sig.png' alt='sig flow' />
          <Text>署名アルゴリズムを使った署名方法</Text>
        </VStack>
      </HStack>
      <Divider />
      <HStack>
        <VStack>
          <Image src='/img/sigveri/hanko_verify.png' alt='hanko flow' />
          <Text>印鑑登録を使った検証方法</Text>
        </VStack>
        <Box boxSize={'40'}/>
        <VStack>
          <Image src='/img/sigveri/sig_verify.png' alt='sig flow' />
          <Text>署名検証アルゴリズムを使った検証方法</Text>
        </VStack>
      </HStack>
    </VStack>
    
    <VStack className={styles.toolblock}>
      <Heading>鍵生成</Heading>
      <Text>
        {text['keygen']}
      </Text>
      <HStack>
        <Button onClick={onGenKeyPairButtonClicked} colorScheme={'blue'}>
          Generate Key Pair
        </Button>
        <VStack align={'start'}>
          <HexOnelineComponent title='秘密鍵' hex={priv} copy={copy}/>
          <HexOnelineComponent title='公開鍵' hex={pubkey} copy={copy}/>
        </VStack>
      </HStack>
    </VStack>

    <HStack>
    <VStack className={styles.toolblock}>
      <Heading>署名アルゴリズム</Heading>
      <InputGroup size={'sm'}>
        <InputLeftAddon children='秘密鍵' width={'12ch'}/>
        <Input type='text' placeholder='0x1234dd...' onChange={(e) => onSigningKeyChanged(e.target.value)} width={'68ch'} fontFamily={hexFont}/>
      </InputGroup>
      <InputGroup size={'sm'}>
        <InputLeftAddon children='メッセージ' width={'12ch'}/>
        <Textarea placeholder='signed message' onChange={(e) => onSignedMessageChanged(e.target.value)} resize={'vertical'} width={'68ch'} fontFamily={hexFont}/>
      </InputGroup>
      <HexOnelineView title={'SHA256'} hex={signedMessageHashed} copy={copy} size={68}/>
      <Button onClick={onSignClicked} colorScheme={'blue'}>Sign</Button>
      <InputGroup size={'sm'}>
        <InputLeftAddon children='署名' width={'12ch'}/>
        <Textarea width={'68ch'} value={signature?.toString('hex') ?? ''} fontFamily={hexFont} readOnly={true}/>
      </InputGroup>
    </VStack>
    
    <VStack className={styles.toolblock}>
      <Heading>検証アルゴリズム</Heading>
      <InputGroup size={'sm'}>
        <InputLeftAddon children='公開鍵' width={'12ch'}/>
        <Input type='text' placeholder='0x1234dd...' onChange={(e) => onVerifingKeyChanged(e.target.value)}  width={'70ch'} fontFamily={hexFont}/>
      </InputGroup>
      <InputGroup size={'sm'}>
        <InputLeftAddon children='メッセージ' width={'12ch'}/>
        <Textarea placeholder='signed message' onChange={(e) => onVerifiedMessageChanged(e.target.value)} resize={'vertical'} width={'70ch'} fontFamily={hexFont}/>
      </InputGroup>
      <HexOnelineView title={'SHA256'} hex={verifiedMessageHashed} copy={copy} size={70}/>
      <InputGroup size={'sm'}>
        <InputLeftAddon children='署名' width={'12ch'}/>
        <Textarea placeholder='0x1234...' onChange={(e) => onSignatureChanged(e.target.value)} resize={'vertical'} width={'70ch'} fontFamily={hexFont}/>
      </InputGroup>
      <Button onClick={onVerifyClicked} colorScheme={'blue'}>Verify</Button>
      {sigResult}
    </VStack>
    </HStack>
    
    
    
  </VStack>)
}