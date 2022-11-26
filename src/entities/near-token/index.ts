import { ModuleContext, type NEARToken as NEARTokenModule } from "./context";
import { ntBalancesRender } from "./ui/nt-balances";

export { type NEARTokenModule };

export class NEARToken extends ModuleContext {
    static balancesRender = ntBalancesRender;
}
