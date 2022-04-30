// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { IncomingMessage, ServerResponse } from 'http'
import { Server } from 'socket.io'
import { BlockchainValidator } from '../../consensus/blockchain_validator'
import { ConsensusEngine } from '../../consensus/consensus_engine'
import { TransactionVerifier } from '../../consensus/transaction_verifiier'
import { Block } from '../../types/blockchain/block'
import { Blockchain } from '../../types/blockchain/blockchain'

const verifier = new TransactionVerifier()
const engine = new ConsensusEngine()
const validator = new BlockchainValidator(verifier, engine)

const blockchain = new Blockchain()

const SocketHandler = (req: IncomingMessage, res: any) => {
    if (res.socket.server.io) {
        console.log('socket connection already established')
    } else {
        console.log('new socket connetion is being created...')
        const io = new Server(res.socket.server)
        res.socket.server.io = io

        io.on('connection', socket => {
            socket.on('send', msg => {
                socket.broadcast.emit('new-transaction', msg)
            })

            socket.on('propagate', msg => {
                const block = Block.decode(Buffer.from(msg, 'hex'))
                if(!validate(block)){
                    return
                }
                console.log('block', msg)
                blockchain.blocks.push(block)
                socket.broadcast.emit('new-block', msg)
            })
        })
    }
    res.end()
}

const validate = (block: Block): boolean => {
    const error = validator.tryAppendBlock(blockchain, block)
    if(!error) {
        return true    
    }
    console.log('malformed block ', error.height, 'received:', error.message)
    return false
}

export default SocketHandler