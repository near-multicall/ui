import { NEAREntity, FTEntity } from "../../entities";

export namespace TokenBalances {
    export interface Inputs extends NEAREntity.Inputs, FTEntity.Inputs {
        className?: string;
    }
}
