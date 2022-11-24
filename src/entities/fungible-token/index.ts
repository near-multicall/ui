import { FTConfig, FT as FTEntity } from "./config";
import { ftBalances } from "./ui/ft-balances";

class FT extends FTConfig {
    static balances = ftBalances;
}

export { FT, type FTEntity };
