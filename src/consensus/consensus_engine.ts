import { toBigIntBE } from "bigint-buffer";
import { Block } from "../types/blockchain/block";

export interface ConsensusEngineInterface {
    verifyDifficulty(block: Block): boolean
}

export class ConsensusEngine implements ConsensusEngineInterface {
    verifyDifficulty = (block: Block): boolean => {
        const difficultyBuf = block.getDifficultyTarget()
        const difficulty = toBigIntBE(difficultyBuf)

        const scoreBuf = block.hash().slice(0, 4)
        const score = toBigIntBE(scoreBuf)

        // less difficulty makes block production hard
        return difficulty >= score
    }
}