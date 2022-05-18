import { Block } from "../types/blockchain/block";

export type BlockFether = (hash: string) => Promise<{height: number, blockHex?: string}>

export const reorg = async (blocks: Map<string, Block>, currentLatestBlock: Block, fetcher: BlockFether): Promise<Block[]> => {
    let currentBlock = currentLatestBlock
    let currentHash = currentLatestBlock.hashString()

    let reorgedChain: Block[] = []

    //  reorg blockchain until fetched block hash is found in current chain.
    while (!blocks.has(currentHash)) {
        reorgedChain = [currentBlock, ...reorgedChain]
        currentHash = currentBlock.getPrevBlockHashString()
        if (isPreGenesisHash(currentHash)) {
            break
        }

        const res = await fetcher(currentHash)
        if(!res.blockHex) {
            console.log(`couldn't fetch block ${currentHash} from server.`)
            return []   // disallow partially fetched chain to be returned.
        }
        const blob = Buffer.from(res.blockHex, 'hex')
        currentBlock = Block.decode(blob)
    }

    return reorgedChain
}

const isPreGenesisHash = (hash: string): boolean => {
    return hash == '0000000000000000000000000000000000000000000000000000000000000000'
}