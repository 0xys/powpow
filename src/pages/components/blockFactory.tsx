import React from "react";
import { useEffect, useMemo } from "react";
import { Transaction } from "../../types/blockchain/transaction";

export type TxError = {
    index: number,
    message: string,
}

type RemoveTransaction = (hash: string) => void
type WrappedTx = { tx: Transaction, message?: string, isCoinbase: boolean }

const BlockFactoryComponent = React.memo((prop: {
    transactions: Transaction[],
    txerrors: TxError[],
    height: string,
    removeTransaction: RemoveTransaction,
}) => {
    const { transactions, txerrors, height, removeTransaction } = prop;

    const wrappedTxs = useMemo(() => {
        let wrappedTxs: WrappedTx[] = []
        for (let index = 0; index < transactions.length; index++) {
            const isCoinbase = transactions[index].isCoinbase()
            const item = txerrors.find(x => x.index == index)
            wrappedTxs.push({
                tx: transactions[index],
                message: item?.message,
                isCoinbase: isCoinbase,
            })
        }
        return wrappedTxs
    }, [transactions, txerrors])

    return (
        <div>
            Block Factory {height}
            <br />
            <li>
            <ul>
                {wrappedTxs.map((tx,j) => (
                    <li key={tx.tx.hashString()}>
                        {tx.tx.hashString()} {tx.message} <button onClick={() => removeTransaction(tx.tx.hashString())} disabled={tx.isCoinbase}>x</button>
                    </li>
                ))}
            </ul>
            </li>
        </div>   
    )
})

BlockFactoryComponent.displayName = 'BlockFactoryComponent'
export { BlockFactoryComponent }