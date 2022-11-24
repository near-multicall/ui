import { Config, FT as FTEntity } from "./config";
import { ftBalances } from "./ui/ft-balances";

export class FT extends Config {
    static balances = ftBalances;
}

export { type FTEntity };
