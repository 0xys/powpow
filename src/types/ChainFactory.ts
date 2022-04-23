import { Block } from "./blockchain/block"

export class ChainFactory {
    private unrealizedBlockchain: Block[]

    constructor(private root: Block) {
        this.unrealizedBlockchain = []
    }

    getRootBlock = (): Block => {
        return this.root
    }
    getUnrealizedBlockchain = (): Block[] => {
        return this.unrealizedBlockchain
    }

    tryAppendBlockToRoot = (block: Block): boolean => {
        if (this.root.hashString() != block.getPrevBlockHashString()) {
            return false
        }
        if (this.unrealizedBlockchain.length != 0) {
            return false
        }
        this.unrealizedBlockchain.push(block)
        return true
    }
    tryAppendBlockToTail = (block: Block): boolean => {
        if (this.unrealizedBlockchain.length < 1) {
            return false
        }
        const tail = this.unrealizedBlockchain[this.unrealizedBlockchain.length - 1]
        if (tail.hashString() != block.getPrevBlockHashString()) {
            return false
        }
        this.unrealizedBlockchain.push(block)
        return true
    }
}