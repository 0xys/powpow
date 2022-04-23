import { toBufferBE } from "bigint-buffer";
import { Block } from "./blockchain/block";
import { Transaction } from "./blockchain/transaction";

export class BlockFactory {
    private version: bigint
    private transactions: Transaction[]
    private nonce: bigint
    private height: bigint
    private prevBlockHash: Buffer
    private difficultyTarget: Buffer

    constructor(
        version: bigint,
        height: bigint,
        prevBlockHash: Buffer,
        difficultyTarget: Buffer
    ) {
        this.version = version
        this.transactions = []
        this.nonce = BigInt(0)
        this.height = height
        this.prevBlockHash = prevBlockHash
        this.difficultyTarget = difficultyTarget
    }

    getVersion = (): bigint => {
        return this.version
    }
    getVersionBuffer = (): Buffer => {
        return toBufferBE(this.version, 4)
    }

    getHeight = (): bigint => {
        return this.height
    }
    getHeightBuffer = (): Buffer => {
        return toBufferBE(this.height, 4)
    }

    getPreviousBlockHash = (): Buffer => {
        return this.prevBlockHash
    }

    addTransactionToBlock = (transaction: Transaction) => {
        this.transactions.push(transaction)
    }
    removeTransaction = (hashString: string) => {
        let newTransactions: Transaction[] = []
        for (let i = 0; i < this.transactions.length; i++) {
            if (this.transactions[i].hashString() == hashString) {
                newTransactions.push(this.transactions[i])
            }
        }
        this.transactions = newTransactions
    }
    getTransactions = (): Transaction[] => {
        return this.transactions
    }

    getDifficultyTarget = (): Buffer => {
        return this.difficultyTarget
    }

    incrementNonce = () => {
        this.nonce += BigInt(1)
    }

    getNonce = (): bigint => {
        return this.nonce
    }
    getNonceBuffer = (): Buffer => {
        return toBufferBE(this.nonce, 4)
    }
}

//  4 byte
const conv = (num: number): Buffer => {
    const arr = [
        (num >> 24) & 255,
        (num >> 16) & 255,
        (num >> 8) & 255,
        num & 255,
    ];
    return Buffer.from(arr)
}