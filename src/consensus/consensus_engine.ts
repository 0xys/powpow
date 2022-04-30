import { toBigIntBE } from "bigint-buffer";
import { Block } from "../types/blockchain/block";

export interface ConsensusEngineInterface {
    isSolved(block: Block): boolean
}

const MAX_DIFFICULTY = toBigIntBE(Buffer.from([0xff, 0xff, 0xff, 0xff]))

export class ConsensusEngine implements ConsensusEngineInterface {
    isSolved = (block: Block): boolean => {
        const difficulty = block.getDifficultyTarget()

        const scoreBuf = block.hash().slice(0, 4)
        const score = toBigIntBE(scoreBuf)

        // higher difficulty makes block production hard
        return score >= difficulty
    }
}