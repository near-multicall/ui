import { nearTokenBalancesRender } from "./ui/near-balances";

export class NearToken {
    static balancesRender = nearTokenBalancesRender;
}

export { type Dependencies as NearTokenDependencies } from "./config";
