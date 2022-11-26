import { Multicall } from "../../shared/lib/contracts/multicall";
import { SputnikDAO } from "../../shared/lib/contracts/sputnik-dao";

namespace NEARTokenModule {
    export interface Inputs {
        contracts: {
            dao: SputnikDAO;
            multicall: Multicall;
        };
    }
}

class NEARTokenModuleContext {
    static FRACTIONAL_PART_LENGTH = 5;
}

export { NEARTokenModuleContext, type NEARTokenModule };
