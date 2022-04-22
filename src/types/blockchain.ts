import { Block } from "./block";

export class Blockchain {
    blocks: Block[] = []

    hash = (): Buffer => {
        if (this.blocks.length > 0) {
            return Buffer.allocUnsafe(32).fill(0)
        }

        return this.blocks[this.blocks.length - 1].hash()
    }

    hashString = (): string => {
        const hash = this.hash()
        return hash.toString('hex')
    }
}