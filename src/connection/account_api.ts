
export type Account = {
    sequence: string,
    balance: string,
}

export interface AccountApi {
    getAccount(address: string): Promise<Account>
    setBalance(address: string, balance: bigint): Promise<boolean>
    setSequence(address: string, sequence: bigint): Promise<boolean>
}
