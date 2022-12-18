import { ModuleContext } from "./module-context";
import { NEARTokenFormat } from "./lib/near-token.format";
import { NEARTokenModel } from "./model/near-token.model";
import { nearTokenBalancesRender } from "./ui/near-token.balances";
import { NEARTokenBalancesProvider } from "./ui/near-token.providers";

export class NEARToken extends ModuleContext {
    static BalancesContext = NEARTokenModel.BalancesContext;
    static BalancesProvider = NEARTokenBalancesProvider;
    static balancesRender = nearTokenBalancesRender;
    static format = NEARTokenFormat;
}
