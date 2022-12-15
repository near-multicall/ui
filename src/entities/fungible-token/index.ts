import { ModuleContext } from "./module-context";
import { FTBalancesProps, ftBalancesRender } from "./ui/ft-balances";
import { FTBalancesProvider, FTBalancesProviderProps } from "./ui/ft-providers";

export class FT extends ModuleContext {
    static BalancesProvider = FTBalancesProvider;
    static balancesRender = ftBalancesRender;
}

export type { FTBalancesProps, FTBalancesProviderProps };
