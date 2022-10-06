import { Multicall } from "../../shared/lib/contracts/multicall";

export interface Dependencies {
    className: string;
    contracts: { multicall: Multicall };
}
