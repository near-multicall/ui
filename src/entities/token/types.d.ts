import { SputnikDAO } from "../../utils/contracts/sputnik-dao";
import { FungibleToken } from "../../utils/standards/fungibleToken";
import { Multicall } from "../../utils/contracts/multicall";

export interface ContractsData {
    dao: SputnikDAO;
    multicall: Multicall;
}
