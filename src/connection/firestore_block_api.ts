import { Firestore } from "firebase-admin/firestore";
import { Block } from "../types/blockchain/block";
import { BlockApi, AppendResult } from "./block_api";

export class FirestoreBlockApi implements BlockApi {

    constructor(private db: Firestore) {

    }

    tryAppendBlock = async (block: Block): Promise<AppendResult> => {
        try{
            const res = await this.db.runTransaction(async (t) => {
                const thisBlockRef = this.db.collection('blocks').doc(block.hashString())
                const thisBlock = await t.get(thisBlockRef)

                const thisBlockHeight = Number(block.getHeight())
                const thisBlockHash = block.hashString()

                if(thisBlock.exists) {
                    return 'failure'    // duplicate disallowed.
                }

                const latestHeightRef = this.db.collection('latest').doc('height')
                const latestHeight = await latestHeightRef.get()

                const latestHashRef = this.db.collection('latest').doc('hash')
                const latestHash = await latestHashRef.get()

                if(!latestHeight.exists) {  // this block is genesis
                    t.set(latestHeightRef, { num: 0 })  // genesis block height is 0.
                    t.set(latestHashRef, { hash: thisBlockHash  })  // genesis block hash
                } else {    // this block is non-genesis
                    const currentLatestHeight: number = latestHeight.data()?.num
                    const currentLatestHash: string = latestHash.data()?.hash

                    let nextLatestHeight = currentLatestHeight
                    let nextLatestHash = currentLatestHash
                    if (thisBlockHeight > currentLatestHeight) {
                        nextLatestHeight = thisBlockHeight
                        nextLatestHash = thisBlockHash
                    }

                    // non-genesis block must have prev block
                    const prevBlockRef = this.db.collection('blocks').doc(block.getPrevBlockHashString())
                    const prevBlock = await t.get(prevBlockRef)

                    if(!prevBlock.exists) {
                        return 'failure'    // prev block must exist.
                    }

                    //  write must come after all reads.
                    t.update(latestHeightRef, { num: nextLatestHeight })
                    t.update(latestHashRef, { hash: nextLatestHash })
                }
    
                t.set(thisBlockRef, {data: block.encodeToHex()})  // add this block as new block entry.
    
                return 'success'
            })
            return res
        } catch (e) {
            console.log(`transaction error on adding ${block.hashString()}.`, e)
            return 'error'
        }
    }

    getLatestHeight = async (): Promise<number> => {
        const latestHeightRef = this.db.collection('latest').doc('height')
        const latestHeight = await latestHeightRef.get()
        const data: any = latestHeight.data()
        if(!data) {
            return 0
        }

        const d: {num: number} = data
        return d.num
    }

    getLatestBlock = async (): Promise<Block|undefined> => {
        const latestHashRef = this.db.collection('latest').doc('hash')
        const latestHash = await latestHashRef.get()
        const data: any = latestHash.data()
        if (!data) {
            return undefined
        }

        const d: {hash: string} = data
        return await this.getBlockByHash(d.hash)
    }

    getBlockByHash = async (hashString: string): Promise<Block|undefined> => {
        const blockRef = this.db.collection('blocks').doc(hashString)
        const block = await blockRef.get()
        const data: any = block.data()
        if (!data) {
            return undefined
        }

        const ret: {data: string} = data
        console.log(`getBlockByHash(${hashString})`, ret.data)
        const decoded = Block.decode(Buffer.from(ret.data, 'hex'))
        return decoded
    }
}