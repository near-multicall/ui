import { NEARParams } from "./near.params";
import { NEARService } from "./near.service";
import { NEARBalancesProvider, nearBalancesRender } from "./near.ui";

export class NEAR extends NEARParams {
    static BalancesContext = NEARService.BalancesContext;
    static BalancesProvider = NEARBalancesProvider;
    static balancesRender = nearBalancesRender;
}
