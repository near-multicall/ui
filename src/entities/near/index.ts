import { NEARTokenModuleContext, type NEARTokenEntity } from "./context";
import { nearTokenBalancesRender } from "./ui/near-balances";

class NEARToken extends NEARTokenModuleContext {
    static balancesRender = nearTokenBalancesRender;
}

export { NEARToken, type NEARTokenEntity };
