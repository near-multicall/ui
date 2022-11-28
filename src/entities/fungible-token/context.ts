import { Multicall } from "../../shared/lib/contracts/multicall";
import { SputnikDAO } from "../../shared/lib/contracts/sputnik-dao";

export namespace FT {
    export interface Inputs {
        adapters: {
            dao: SputnikDAO;
            multicall: Multicall;
        };
    }
}

export class ModuleContext {
    static FRACTIONAL_PART_LENGTH = 5;
}
