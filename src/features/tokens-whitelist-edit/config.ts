import { HTMLProps } from "react";

import { MulticallInstanceEntity } from "../../entities";

namespace TokensWhitelistEditFeature {
    export interface Dependencies
        extends Omit<HTMLProps<HTMLDivElement>, "onChange">,
            MulticallInstanceEntity.Dependencies {
        onEdit: (payload: Pick<MulticallInstanceEntity.ConfigChanges, "addTokens" | "removeTokens">) => void;
        resetTrigger: { subscribe: (callback: EventListener) => () => void };
    }

    export interface FormStates
        extends Record<
            keyof Pick<MulticallInstanceEntity.ConfigChanges, "addTokens" | "removeTokens">,
            Set<
                MulticallInstanceEntity.ConfigChanges[keyof Pick<
                    MulticallInstanceEntity.ConfigChanges,
                    "addTokens" | "removeTokens"
                >][number]
            >
        > {}
}

export { type TokensWhitelistEditFeature };
