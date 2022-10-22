import { FungibleTokenConfig, type FungibleTokenEntity } from "./config";
import { fungibleTokensBalancesRender } from "./ui/ft-balances";

class FungibleToken extends FungibleTokenConfig {
    static allBalancesRender = fungibleTokensBalancesRender;
}

export { FungibleToken, FungibleTokenEntity };
