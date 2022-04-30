import { Block } from "./block";

export class Blockchain {
    blocks: Block[] = []

    hash = (): Buffer => {
        if (this.blocks.length == 0) {
            return Buffer.allocUnsafe(32).fill(0)
        }

        return this.blocks[this.blocks.length - 1].hash()
    }

    hashString = (): string => {
        const hash = this.hash()
        return hash.toString('hex')
    }

    currentDifficulty = (): Buffer => {
        if (this.blocks.length == 0) {
            //  initial difficulty
            return Buffer.from([0xee, 0xff, 0xff, 0xff])
        }

        return this.blocks[this.blocks.length - 1].getDifficultyTargetBuffer()
    }
}