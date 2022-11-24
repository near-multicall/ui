import { NEAREntity, FTEntity } from "../../entities";

export namespace Widget {
    export interface Inputs extends NEAREntity.Inputs, FTEntity.Inputs {
        className?: string;
    }
}
