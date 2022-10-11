import { Multicall } from "../../shared/lib/contracts/multicall";
import { SputnikDAO } from "../../shared/lib/contracts/sputnik-dao";

namespace FungibleTokenEntity {
    export interface Dependencies {
        contracts: {
            dao: SputnikDAO;
            multicall: Multicall;
        };
    }
}

class FungibleTokenConfig {
    static FRACTIONAL_PART_LENGTH = 5;
}

export { FungibleTokenConfig, type FungibleTokenEntity };
