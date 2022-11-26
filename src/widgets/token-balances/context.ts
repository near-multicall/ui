import { NEARTokenEntity, FTEntity } from "../../entities";

export namespace TokenBalances {
    export interface Inputs extends NEARTokenEntity.Inputs, FTEntity.Inputs {
        className?: string;
    }
}
