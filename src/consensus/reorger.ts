import { Block } from "../types/blockchain/block";

export type BlockFether = (hash: string) => Promise<{height: number, block?: Buffer}>

export const reorg = async (blocks: Map<string, Block>, currentLatestBlock: Block, fetcher: BlockFether): Promise<Block[]> => {
    let currentBlock = currentLatestBlock
    let currentHash = currentLatestBlock.hashString()

    let reorgedChain: Block[] = []

    //  reorg blockchain until fetched block hash is found in current chain.
    while (!blocks.has(currentHash)) {
        reorgedChain = [currentBlock, ...reorgedChain]
        currentHash = currentBlock.getPrevBlockHashString()
        const res = await fetcher(currentHash)
        if(!res.block) {
            console.log(`couldn't fetch block ${currentHash} from server.`)
            return []   // disallow partially fetched chain to be returned.
        }
        currentBlock = Block.decode(res.block)
    }

    return reorgedChain
}