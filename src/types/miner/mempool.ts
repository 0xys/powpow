import { Transaction } from "../blockchain/transaction";

export class Mempool {
    private mapping: Map<string, Transaction>

    constructor(transactions: Transaction[]) {
        this.mapping = new Map()
        for (const tx of transactions) {
            this.mapping.set(tx.hashString(), tx)
        }
    }

    getTransactions = (): Map<string, Transaction> => { 
        return this.mapping
    }
    tryGetTransactionByHash = (hash: Buffer): { found: boolean, tx?: Transaction} => {
        const hashString = hash.toString('hex')
        return this.tryGetTransactionByHashString(hashString)
    }
    tryGetTransactionByHashString = (hashString: string): { found: boolean, tx?: Transaction} => {
        const tx = this.mapping.get(hashString)
        if (!tx) {
            return { found: false, }
        }
        return { found: true, tx: tx }
    }

    removeTransactionByHash = (hash: Buffer): Transaction|undefined => {
        const hashString = hash.toString('hex')
        return this.removeTransactionByHashString(hashString)
    }
    removeTransactionByHashString = (hashString: string): Transaction|undefined => {
        const tx = this.mapping.get(hashString)
        this.mapping.delete(hashString)
        return tx
    }

    contains = (hash: Buffer): boolean => {
        const hashString = hash.toString('hex')
        return this.mapping.has(hashString)
    }
    containsByHashString = (hashString: string): boolean => {
        return this.mapping.has(hashString)
    }

    put = (tx: Transaction): boolean => {
        const hashString = tx.hashString()
        if (this.containsByHashString(hashString)) {
            return false
        }

        this.mapping.set(hashString, tx)
        return true
    }

    static Empty = (): Mempool => {
        return new Mempool([])
    }
}