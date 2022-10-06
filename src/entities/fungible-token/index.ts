import { fungibleTokensBalancesRender } from "./ui/ft-balances";

export class FungibleToken {
    static allBalancesRender = fungibleTokensBalancesRender;
}

export { type Dependencies as FungibleTokensDependencies } from "./config";
