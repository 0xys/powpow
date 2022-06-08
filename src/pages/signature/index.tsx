import { Box, VStack, HStack, Input, Button, Divider } from '@chakra-ui/react'
import { useMemo, useState } from 'react'
import crypto from 'crypto'
import { createHash } from 'crypto';
import secp256k1 from 'secp256k1'


export default function SignaturePage() {
    const [message, setMessagee] = useState('')
    const [priv, setPrivateKey] = useState<Uint8Array>()
    const [signingKey, setSigningKey] = useState<Buffer>()
    const [signature, setSignature] = useState<Buffer>()
    const [verifyingKey, setVerifyingKey] = useState<Buffer>()
    const [sigValidity, setSigValidity] = useState<boolean>(false)

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
    const onMessageChange = (m: string) => {
        setMessagee(m)
    }
    const [messageUtf8Str, messageHashedStr, messageHashed] = useMemo(() => {
        const utf8 = Buffer.from(message, 'utf8')
        const hashed = createHash('sha256').update(utf8).digest()
        return [utf8.toString('hex'), hashed.toString('hex'), hashed]
    }, [message])
    const onSignClicked = () => {
        if (!signingKey) {
            return
        }
        const sig = secp256k1.ecdsaSign(messageHashed, signingKey)
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
    const onVerifyClicked = () => {
        if (!verifyingKey || !signature) {
            return
        }

        const ok = secp256k1.ecdsaVerify(signature, messageHashed, verifyingKey)
        setSigValidity(ok)
    }

    return <VStack>
        <Divider />
        <h2>Key</h2>
        <Button onClick={onGenKeyPairButtonClicked}>
            Generate Key Pair
        </Button>
        <VStack>
            <h4>Private Key: {Buffer.from(priv ?? []).toString('hex')}</h4>
            <h4>Public  Key: {Buffer.from(pubkey ?? []).toString('hex')}</h4>
        </VStack>
        <Divider />
        <h2>Sign</h2>
        <VStack>
            <HStack>
                <h4>Private Key</h4>
                <Input placeholder='0x1234dd...' onChange={(e) => onSigningKeyChanged(e.target.value)}/>
            </HStack>
            <HStack>
                <h4>Message</h4>
                <Input placeholder='signed message' onChange={(e) => onMessageChange(e.target.value)}/>
            </HStack>
            <h5>utf-8: {messageUtf8Str}</h5>
            <h5>sha256ed: {messageHashedStr}</h5>
            <Button onClick={onSignClicked}>Sign</Button>
            <h5>signature: {signature?.toString('hex') ?? ''}</h5>
        </VStack>
        <Divider />
        <h2>Verify</h2>
        <VStack>
            <HStack>
                <h4>Public Key</h4>
                <Input placeholder='0x1234dd...' onChange={(e) => onVerifingKeyChanged(e.target.value)}/>
            </HStack>
            <HStack>
                <h4>Message</h4>
                <Input placeholder='signed message' onChange={(e) => onMessageChange(e.target.value)}/>
            </HStack>
            <h5>utf-8: {messageUtf8Str}</h5>
            <h5>sha256ed: {messageHashedStr}</h5>
            <HStack>
                <h4>Signature</h4>
                <Input placeholder='signed message' onChange={(e) => onSignatureChanged(e.target.value)}/>
            </HStack>

            <Button onClick={onVerifyClicked}>Verify</Button>
            <h5>ok? {sigValidity ? 'YES':'NO'}</h5>
        </VStack>
    </VStack>
}