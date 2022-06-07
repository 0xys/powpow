import React from "react";
import { Transaction } from "../../types/blockchain/transaction";

export const TransactionPreviewComponent = React.memo((prop: {
    tx: Transaction,
    onDiscard: (hash: string) => void,
    onAdd: (hash: string) => void,
}) => {
    const { tx, onAdd, onDiscard } = prop

    return <div>
      Selected: {tx.hashString()}
      <br />
      From: {tx.getFromAddressString()}
      <br />
      To: {tx.getDests()[0].getAddressString()}
      <br />
      Amount: {tx.getDests()[0].getAmount().toString()}
      <br />
      Message: {tx.getDests()[0].getMessageUtf8()}
      <br />
      <button onClick={() => onAdd(tx.hashString())}>
        add
      </button>
      <button onClick={() => onDiscard(tx.hashString())}>
        discard
      </button>
    </div>
})