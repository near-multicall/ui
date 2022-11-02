import { HTMLProps } from "react";

import { MulticallTokensWhitelistDiffKey, type MulticallConfigDiff } from "../../shared/lib/contracts/multicall";
import { MulticallInstanceEntity } from "../../entities";

namespace TokensWhitelistEditFeature {
    export type DiffKey = MulticallTokensWhitelistDiffKey;

    export interface Dependencies
        extends Omit<HTMLProps<HTMLDivElement>, "onChange">,
            MulticallInstanceEntity.Dependencies {
        onEdit: (payload: Pick<MulticallConfigDiff, DiffKey>) => void;
        resetTrigger: { subscribe: (callback: EventListener) => () => void };
    }

    export interface FormStates
        extends Record<
            keyof Pick<MulticallConfigDiff, DiffKey>,
            Set<MulticallConfigDiff[keyof Pick<MulticallConfigDiff, DiffKey>][number]>
        > {}
}

class TokensWhitelistEditConfig {
    static DiffKey = MulticallTokensWhitelistDiffKey;
}

export { TokensWhitelistEditConfig, type TokensWhitelistEditFeature };
