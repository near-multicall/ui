import { ModuleContext, type NEARToken as NEARTokenModule } from "./module-context";
import { nearTokenBalancesRender, type NEARTokenBalancesProps } from "./ui/near-token.balances";

export class NEARToken extends ModuleContext {
    static balancesRender = nearTokenBalancesRender;
}

export type { NEARTokenModule, NEARTokenBalancesProps };
