// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { IncomingMessage, ServerResponse } from 'http'
import { Server } from 'socket.io'
import { DefaultBlockApi } from '../../connection/block_api'
import { Block } from '../../types/blockchain/block'

const api = new DefaultBlockApi()

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

            socket.on('propagate', async msg => {
                const block = Block.decode(Buffer.from(msg, 'hex'))
                console.log(`block[${block.getHeight().toString()}]`, msg)
                const ok = await api.tryAppendBlock(block)
                if(!ok) {
                    return
                }
                socket.broadcast.emit('new-block', msg)
            })
        })
    }
    res.end()
}

export default SocketHandler