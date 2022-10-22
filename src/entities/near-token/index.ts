import { NearTokenConfig, type NearTokenEntity } from "./config";
import { nearTokenBalancesRender } from "./ui/near-balances";

class NearToken extends NearTokenConfig {
    static balancesRender = nearTokenBalancesRender;
}

export { NearToken, type NearTokenEntity };
