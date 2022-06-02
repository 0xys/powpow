// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { IncomingMessage, ServerResponse } from 'http'
import { Server } from 'socket.io'
import { DefaultBlockApi } from '../../connection/block_api'
import { Block } from '../../types/blockchain/block'

import admin from'firebase-admin';
import { applicationDefault } from'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { FirestoreBlockApi } from '../../connection/firestore_block_api';

const SocketHandler = (req: any, res: any) => {

    if (admin.apps.length === 0) {
        admin.initializeApp({
            credential: applicationDefault()
        })
    }
    const db = getFirestore()
    const api = new FirestoreBlockApi(db)

    if (res.socket.server.io) {
        console.log('socket connection already established')
    } else {
        console.log('new socket connetion is being created...')
        const io = new Server(res.socket.server)
        res.socket.server.io = io

        io.on('connection', socket => {
            socket.on('send', msg => {
                socket.emit('new-transaction', msg)
            })

            socket.on('propagate', async msg => {
                const block = Block.decode(Buffer.from(msg, 'hex'))
                console.log(`block[${block.getHeight().toString()}]`, msg)
                const status = await api.tryAppendBlock(block)
                if(status != 'success') {
                    return
                }
                socket.broadcast.emit('new-block', msg)
            })
        })
    }
    res.end()
}

export default SocketHandler