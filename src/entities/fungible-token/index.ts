import { ModuleContext, FT as FTModule } from "./module-context";
import { ftBalances } from "./ui/ft-balances";

export { type FTModule };

export class FT extends ModuleContext {
    static balances = ftBalances;
}
