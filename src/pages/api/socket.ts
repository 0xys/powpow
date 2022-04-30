// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { IncomingMessage, ServerResponse } from 'http'
import { Server } from 'socket.io'
import { Block } from '../../types/blockchain/block'

let blocks: Block[] = []

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
                blocks.push(block)
                console.log(blocks.length, 'block', msg)
                socket.broadcast.emit('new-block', msg)
            })
        })
    }
    res.end()
}


export default SocketHandler