import { Multicall } from "../../shared/lib/contracts/multicall";
import { SputnikDAO } from "../../shared/lib/contracts/sputnik-dao";

namespace NearTokenEntity {
    export interface Dependencies {
        contracts: {
            dao: SputnikDAO;
            multicall: Multicall;
        };
    }
}

class NearTokenConfig {
    static FRACTIONAL_PART_LENGTH = 5;
}

export { NearTokenConfig, type NearTokenEntity };
