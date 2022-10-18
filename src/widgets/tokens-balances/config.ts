import { NearTokenEntity, FungibleTokenEntity } from "../../entities";

namespace TokensBalancesWidget {
    export interface Dependencies extends NearTokenEntity.Dependencies, FungibleTokenEntity.Dependencies {
        className?: string;
    }
}

export { type TokensBalancesWidget };
