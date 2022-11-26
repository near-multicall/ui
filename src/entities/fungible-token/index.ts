import { ModuleContext, FT as FTEntity } from "./context";
import { ftBalances } from "./ui/ft-balances";

export class FT extends ModuleContext {
    static balances = ftBalances;
}

export { type FTEntity };
