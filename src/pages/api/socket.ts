// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { IncomingMessage, ServerResponse } from 'http'
import type { NextApiRequest, NextApiResponse } from 'next'
import { Server } from 'socket.io'

type Data = {
  name: string
}

const SocketHandler = (req: IncomingMessage, res: any) => {
    if (res.socket.server.io) {
        console.log('socket connection already established')
    } else {
        console.log('new socket connetion is being created...')
        const io = new Server(res.socket.server)
        res.socket.server.io = io

        io.on('connection', socket => {
            socket.on('input-change', msg => {
                console.log('input-change', msg)
                socket.broadcast.emit('update-input', msg)
            })
        })
    }
    res.end()
}


export default SocketHandler