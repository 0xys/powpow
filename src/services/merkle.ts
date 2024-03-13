import { createHash } from "crypto"

/**
 * SHA256 merkle tree
 * following bitcoin way
 * https://developer.bitcoin.org/reference/block_chain.html#merkle-trees
 * */ 
export const merkle = (items: Buffer[]): Buffer => {
    if (items.length == 1) {
        return items[0]
    }

    let currentArrays = items
    while(true) {
        const parentArrays: Buffer[] = []

        for (let i = 1; i < currentArrays.length; i+=2) {
            const parent = getParent(currentArrays[i-1], currentArrays[i])
            parentArrays.push(parent)
        }

        //  in case of odd number children
        if (currentArrays.length % 2 == 1) {
            const rightMost = currentArrays[currentArrays.length - 1]
            const parent = getParent(rightMost, rightMost)  // duplicate right most child
            parentArrays.push(parent)
        }

        if(parentArrays.length == 1) {
            return parentArrays[0]
        }
        currentArrays = parentArrays
    }
}

const getParent = (a: Buffer, b: Buffer): Buffer => 
    createHash('sha256')
        .update(a)
        .update(b)
        .digest()