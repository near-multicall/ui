import { NearTokenEntity, FungibleTokenEntity } from "../../entities";

export namespace TokensBalancesWidget {
    export interface Dependencies extends NearTokenEntity.dependencies, FungibleTokenEntity.dependencies {
        className?: string;
    }
}
