import { NearTokenEntity, FungibleTokenEntity } from "../../entities";

namespace TokensBalancesWidget {
    export interface Inputs extends NearTokenEntity.Inputs, FungibleTokenEntity.Inputs {
        className?: string;
    }
}

export { type TokensBalancesWidget };
