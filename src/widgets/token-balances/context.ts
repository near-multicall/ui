import { NEARTokenModule, FTModule } from "../../entities";

export namespace TokenBalances {
    export interface Inputs extends NEARTokenModule.Inputs, FTModule.Inputs {
        className?: string;
    }
}
