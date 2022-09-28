import { SputnikDAO } from "../../shared/lib/contracts/sputnik-dao";
import { FungibleToken } from "../../shared/lib/standards/fungibleToken";
import { Multicall } from "../../shared/lib/contracts/multicall";

export interface ContractsData {
    dao: SputnikDAO;
    multicall: Multicall;
}
