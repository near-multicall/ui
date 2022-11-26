import { ModuleContext, FT as FTModule } from "./context";
import { ftBalances } from "./ui/ft-balances";

export class FT extends ModuleContext {
    static balances = ftBalances;
}

export { type FTModule };
