import { Multicall } from "../../shared/lib/contracts/multicall";
import { SputnikDAO } from "../../shared/lib/contracts/sputnik-dao";

export interface Dependencies {
    contracts: {
        dao: SputnikDAO;
        multicall: Multicall;
    };
}

export const FRACTIONAL_PART_LENGTH = 5;
