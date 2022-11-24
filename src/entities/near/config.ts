import { Multicall } from "../../shared/lib/contracts/multicall";
import { SputnikDAO } from "../../shared/lib/contracts/sputnik-dao";

namespace NEAREntity {
    export interface Inputs {
        contracts: {
            dao: SputnikDAO;
            multicall: Multicall;
        };
    }
}

class NEARConfig {
    static FRACTIONAL_PART_LENGTH = 5;
}

export { NEARConfig, type NEAREntity };
