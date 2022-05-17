import { Battery, Machine } from "./machine";
import { Wallet } from "./wallet";
import * as bip39 from "bip39"
import hdkey from 'hdkey'
import { Mempool } from "./mempool";

export const defaultNumOfWallets = 6

export class Miner {
    private wallets: Wallet[] = []
    private mempool: Mempool
    private nodePublicKey: Buffer
    private nodePrivateKey: Buffer

    constructor(private mnemonic: string, private name: string, private machines: Machine[], private batteries: Battery[]){
        const seed = bip39.mnemonicToSeedSync(mnemonic)
        const root = hdkey.fromMasterSeed(seed)
        for (let i = 0; i < defaultNumOfWallets; i++) {
            const child = root.derive(`m/44'/1234'/0'/${i}`)
            const wallet = new Wallet(child.privateKey)
            this.wallets.push(wallet)
        }

        const nodeKey = root.derive('m/0')
        this.nodePrivateKey = nodeKey.privateKey
        this.nodePublicKey = nodeKey.publicKey

        this.mempool = Mempool.Empty()
    }

    getNodePublicKey = (): Buffer => {
        return this.nodePublicKey
    }
    getNodePublicKeyString = (): string => {
        return this.nodePublicKey.toString('hex')
    }

    getMnemonic = (): string => {
        return this.mnemonic
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