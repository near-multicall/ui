import { HTMLProps } from "react";

import { MulticallInstanceEntity } from "../../entities";

namespace TokensWhitelistEditFeature {
    export interface Dependencies
        extends Omit<HTMLProps<HTMLDivElement>, "onChange">,
            MulticallInstanceEntity.Dependencies {
        onEdit: (payload: FormState) => void;
    }

    export type FormState = Pick<MulticallInstanceEntity.ConfigChanges, "addTokens" | "removeTokens">;
}

export { type TokensWhitelistEditFeature };
