import { ModuleContext } from "./module-context";
import { FTFormat } from "./lib/fungible-token.format";
import { FTModel } from "./model/fungible-token.model";
import { ftBalancesRender } from "./ui/fungible-token.balances";
import { FTBalancesProvider } from "./ui/fungible-token.providers";

export class FT extends ModuleContext {
    static BalancesContext = FTModel.BalancesContext;
    static BalancesProvider = FTBalancesProvider;
    static balancesRender = ftBalancesRender;
    static format = FTFormat;
}
