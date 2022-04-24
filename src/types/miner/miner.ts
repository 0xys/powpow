import { Battery, Machine } from "./machine";
import { Wallet } from "./wallet";
import * as bip39 from "bip39"
import hdkey from 'hdkey'
import { Mempool } from "./mempool";

export const defaultNumOfWallets = 6

export class Miner {
    private wallets: Wallet[] = []
    private mempool: Mempool;

    constructor(mnemonic: string, private name: string, private machines: Machine[], private batteries: Battery[]){
        const seed = bip39.mnemonicToSeedSync(mnemonic)
        const root = hdkey.fromMasterSeed(seed)
        for (let i = 0; i < defaultNumOfWallets; i++) {
            const node = root.derive(`m/44'/1234'/0'/${i}`)
            const wallet = new Wallet(node.privateKey)
            this.wallets.push(wallet)
        }

        this.mempool = Mempool.Empty()
    }

    getName = (): string => {
        return this.name
    }

    getWallets = (): Wallet[] => {
        return this.wallets
    }

    getWallet = (index: number): Wallet => {
        return this.wallets[index]
    }

    getMempool = (): Mempool => {
        return this.mempool
    }

    getMachines = (): Machine[] => {
        return this.machines
    }

    getBatteries = (): Battery[] => {
        return this.batteries
    }

    static GenerateRandom = (name: string): Miner => {
        const mnemonic = bip39.generateMnemonic()
        return new Miner(mnemonic, name, [Machine.Default()], [Battery.Default()])
    }
}