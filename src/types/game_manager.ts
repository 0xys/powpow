export const wip = 1

// import { Block } from "./blockchain/block";
// import { Blockchain } from "./blockchain/blockchain";
// import { Transaction } from "./blockchain/transaction";
// import { BlockFactory } from "./block_factory";
// import { Miner } from "./miner/miner";

// export class GameManager {
//     private blockchain: Blockchain
//     private miner: Miner
//     private neighbours: Set<string>

//     private focusedTransaction: Transaction
//     private blockFactory: BlockFactory

//     constructor() {

//     }

//     addTransactionToMempool = (transaction: Transaction) => {
//         this.miner.getMempool().put(transaction)
//     }
//     removeTransactionFromMempool = (hashString: string) => {
//         this.miner.getMempool().removeTransactionByHashString(hashString)
//     }
//     focusTransactionFromMempool = (hashString: string) => {
//         const removed = this.miner.getMempool().removeTransactionByHashString(hashString)
//         if (!removed) {
//             return
//         }
//         this.focusedTransaction = removed
//     }

//     addNeighbour = (neighbourName: string) => {
//         this.neighbours.add(neighbourName)
//     }
//     removeNeighbour = (neighbourName: string) => {
//         this.neighbours.delete(neighbourName)
//     }

//     broadcastBlocks = (block: Block) => {
        
//     }
// }