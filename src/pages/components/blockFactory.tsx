import React from "react";
import { useEffect, useMemo } from "react";
import { Transaction } from "../../types/blockchain/transaction";

export type TxError = {
    index: number,
    message: string,
}

type RemoveTransaction = (hash: string) => void;

export const BlockFactoryComponent = React.memo((prop: {
    transactions: Transaction[],
    txerrors: TxError[],
    height: string,
    removeTransaction: RemoveTransaction,
}) => {
    const { transactions, txerrors, height, removeTransaction } = prop;

    const wrappedTxs = useMemo(() => {
        let wrappedTxs: {tx: Transaction, message?: string}[] = []
        for (let index = 0; index < transactions.length; index++) {
            const item = txerrors.find(x => x.index == index)
            wrappedTxs.push({
                tx: transactions[index],
                message: item?.message
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
                        {tx.tx.hashString()} {tx.message} <button onClick={() => removeTransaction(tx.tx.hashString())}>x</button>
                    </li>
                ))}
            </ul>
            </li>
        </div>   
    )
})