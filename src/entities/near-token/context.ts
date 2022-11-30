import { Multicall } from "../../shared/lib/contracts/multicall";
import { SputnikDAO } from "../../shared/lib/contracts/sputnik-dao";

export namespace NEARToken {
    export interface Inputs {
        adapters: {
            dao: SputnikDAO;
            multicallInstance: Multicall;
        };
    }
}

export class ModuleContext {
    static FRACTIONAL_PART_LENGTH = 5;
}
