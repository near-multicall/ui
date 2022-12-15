import { ModuleContext, type NEARToken as NEARTokenModule } from "./module-context";
import { nearTokenBalancesRender, type NEARTokenBalancesProps } from "./ui/nt-balances";

export class NEARToken extends ModuleContext {
    static balancesRender = nearTokenBalancesRender;
}

export type { NEARTokenModule, NEARTokenBalancesProps };
