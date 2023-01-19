import { FTService } from "./ft.service";
import { FTParams } from "./ft.params";
import { FTBalancesProvider, ftBalancesRender } from "./ft.ui";

export class FT extends FTParams {
    static BalancesContext = FTService.BalancesContext;
    static BalancesProvider = FTBalancesProvider;
    static balancesRender = ftBalancesRender;
}
