import { NearTokenDependencies } from "../../entities";
import { FungibleTokensDependencies } from "../../entities";

export interface Dependencies extends FungibleTokensDependencies, NearTokenDependencies {
    className?: string;
}
