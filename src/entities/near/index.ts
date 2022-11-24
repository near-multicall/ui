import { NEARConfig, type NEAREntity } from "./config";
import { nearTokenBalancesRender } from "./ui/near-balances";

class NEAR extends NEARConfig {
    static balancesRender = nearTokenBalancesRender;
}

export { NEAR, type NEAREntity };
