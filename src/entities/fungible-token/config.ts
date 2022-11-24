import { Multicall } from "../../shared/lib/contracts/multicall";
import { SputnikDAO } from "../../shared/lib/contracts/sputnik-dao";

export namespace FT {
    export interface Inputs {
        contracts: {
            dao: SputnikDAO;
            multicall: Multicall;
        };
    }
}

export class Config {
    static FRACTIONAL_PART_LENGTH = 5;
}
