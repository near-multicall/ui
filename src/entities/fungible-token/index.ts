import { ModuleContext } from "./module-context";
import { FTBalancesProps, ftBalancesRender } from "./ui/fungible-token.balances";
import { FTBalancesProvider } from "./ui/fungible-token.providers";

export class FT extends ModuleContext {
    static BalancesProvider = FTBalancesProvider;
    static balancesRender = ftBalancesRender;
}

export type { FTBalancesProps };
