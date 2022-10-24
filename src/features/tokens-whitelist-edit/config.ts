import { HTMLProps } from "react";

import { MulticallInstanceEntity } from "../../entities";

namespace TokensWhitelistEditFeature {
    export interface Dependencies
        extends Omit<HTMLProps<HTMLDivElement>, "onChange">,
            MulticallInstanceEntity.Dependencies {
        onEdit: (payload: Pick<MulticallInstanceEntity.ConfigChanges, "addTokens" | "removeTokens">) => void;
    }
}

export { type TokensWhitelistEditFeature };
