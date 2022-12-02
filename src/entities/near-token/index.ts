import { ModuleContext, type NEARToken as NEARTokenModule } from "./module-context";
import { ntBalancesRender } from "./ui/nt-balances";

export { type NEARTokenModule };

export class NEARToken extends ModuleContext {
    static balancesRender = ntBalancesRender;
}
