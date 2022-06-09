import { Box, VStack, HStack, Input, Button, Divider, Heading, ButtonGroup, IconButton, Textarea, InputGroup, InputLeftAddon, useToast, Alert, AlertIcon, AlertTitle } from '@chakra-ui/react'
import { AddIcon, CopyIcon } from '@chakra-ui/icons'
import { useCallback, useMemo, useState } from 'react'
import crypto from 'crypto'
import { createHash } from 'crypto';
import secp256k1 from 'secp256k1'
import { hexFont, HexOnelineComponent } from '../components/hex/hexOneline';
import { HexOnelineView } from '../components/hex/hexOnelineView';

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

    return <VStack>
        <Divider />
        <Heading>Key</Heading>
        <HStack>
            <Button onClick={onGenKeyPairButtonClicked} colorScheme={'blue'}>
                Generate Key Pair
            </Button>
            <VStack align={'start'}>
                <HexOnelineComponent title='Private Key' hex={priv} copy={copy}/>
                <HexOnelineComponent title='Public Key' hex={pubkey} copy={copy}/>
            </VStack>
        </HStack>
        <Divider />
        <Heading>Sign</Heading>
        <VStack>
            <InputGroup size={'sm'}>
                <InputLeftAddon children='Private Key' width={'12ch'}/>
                <Input type='text' placeholder='0x1234dd...' onChange={(e) => onSigningKeyChanged(e.target.value)} width={'68ch'} fontFamily={hexFont}/>
            </InputGroup>
            <InputGroup size={'sm'}>
                <InputLeftAddon children='Message' width={'12ch'}/>
                <Textarea placeholder='signed message' onChange={(e) => onSignedMessageChanged(e.target.value)} resize={'vertical'} width={'68ch'} fontFamily={hexFont}/>
            </InputGroup>
            <HexOnelineView title={'SHA256'} hex={signedMessageHashed} copy={copy} size={68}/>
            <Button onClick={onSignClicked} colorScheme={'blue'}>Sign</Button>
            <InputGroup size={'sm'}>
                <InputLeftAddon children='Signature' width={'12ch'}/>
                <Textarea width={'68ch'} value={signature?.toString('hex') ?? ''} fontFamily={hexFont}/>
            </InputGroup>
        </VStack>
        <Divider />
        <Heading>Verify</Heading>
        <VStack>
            <InputGroup size={'sm'}>
                <InputLeftAddon children='Public Key' width={'12ch'}/>
                <Input type='text' placeholder='0x1234dd...' onChange={(e) => onVerifingKeyChanged(e.target.value)}  width={'70ch'} fontFamily={hexFont}/>
            </InputGroup>
            <InputGroup size={'sm'}>
                <InputLeftAddon children='Message' width={'12ch'}/>
                <Textarea placeholder='signed message' onChange={(e) => onVerifiedMessageChanged(e.target.value)} resize={'vertical'} width={'70ch'} fontFamily={hexFont}/>
            </InputGroup>
            <HexOnelineView title={'SHA256'} hex={verifiedMessageHashed} copy={copy} size={70}/>
            <InputGroup size={'sm'}>
                <InputLeftAddon children='Signature' width={'12ch'}/>
                <Textarea placeholder='0x1234...' onChange={(e) => onSignatureChanged(e.target.value)} resize={'vertical'} width={'70ch'} fontFamily={hexFont}/>
            </InputGroup>
            <Button onClick={onVerifyClicked} colorScheme={'blue'}>Verify</Button>
            {sigResult}
        </VStack>
        <Divider />
    </VStack>
}