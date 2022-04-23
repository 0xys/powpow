import { Block } from "./blockchain/block";
import { Blockchain } from "./blockchain/blockchain";
import { Transaction } from "./blockchain/transaction";
import { Miner } from "./miner/miner";

export class GameManager {
    private blockchain: Blockchain
    private miner: Miner
    private neighbours: Miner[]

    private focusedTransaction: Transaction
    private blockInFactory: Block

    constructor() {

    }

    addTransactionToMempool = (transaction: Transaction) => {

    }
    removeTransactionFromMempool = (hashString: string) => {

    }
    focusTransaction = (hashString: Transaction) => {

    }

    addNeighbour = (neighbour: Miner) => {

    }
    removeNeighbour = (index: number) => {

    }

    broadcastBlocks = (block: Block) => {
        
    }
}