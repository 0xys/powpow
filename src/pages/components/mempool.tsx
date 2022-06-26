import React, { useMemo } from "react";
import { Mempool } from "../../types/miner/mempool";

const MempoolComponent = React.memo((prop: {
    mempool: Mempool,
    onRemove: (hash: string) => void,
    onSelect: (hash: string) => void,
}) => {

    const { mempool, onRemove, onSelect } = prop

    const txs = useMemo(() => {
        return mempool.getTransactionsArray()
            .map(x => {
                return {
                    hashFull: x.hashString(),
                    hash: x.hashString().substring(0, 12) + "...",
                    from: x.getFromAddressString().substring(0, 12) + "...",
                    to: x.getDests()[0].getAddressString().substring(0, 12) + "...",
                    amount: x.getDests()[0].getAmount().toString(),
                    feeRate: Number(x.getFee())/x.encodedLen()
                }
            })
    }, [mempool])

    return <div>
        <li>
            <ul>
                {txs.map((tx,j) => (
                    <li key={tx.hashFull}>
                        {tx.hash} {tx.feeRate} {tx.from} {"->"} {tx.to} {tx.amount}
                        <button onClick={() => onSelect(tx.hashFull)}>select</button>
                        <button onClick={() => onRemove(tx.hashFull)}>x</button>
                    </li>
                ))}
            </ul>
        </li>
    </div>
})

MempoolComponent.displayName = 'MempoolComponent'

export { MempoolComponent }