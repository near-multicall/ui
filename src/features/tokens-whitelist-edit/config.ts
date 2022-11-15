import { HTMLProps } from "react";

import { MulticallTokensWhitelistChangesDiffKey, type MulticallConfigDiff } from "../../shared/lib/contracts/multicall";
import { MulticallInstanceEntity } from "../../entities";
import { DesignKitConfigType } from "../../shared/ui/design";

namespace TokensWhitelistEditFeature {
    export type ChangesDiffKey = MulticallTokensWhitelistChangesDiffKey;

    export interface Inputs extends Omit<HTMLProps<HTMLDivElement>, "onChange">, MulticallInstanceEntity.Inputs {
        onEdit: (payload: Pick<MulticallConfigDiff, ChangesDiffKey>) => void;
        resetTrigger: { subscribe: (callback: EventListener) => () => void };
    }

    export interface FormStates
        extends Record<
            keyof Pick<MulticallConfigDiff, ChangesDiffKey>,
            Set<MulticallConfigDiff[keyof Pick<MulticallConfigDiff, ChangesDiffKey>][number]>
        > {}
}

class TokensWhitelistEditConfig {
    public static readonly ChangesDiffKey = MulticallTokensWhitelistChangesDiffKey;

    public static readonly ChangesDiffMetadata = {
        [TokensWhitelistEditConfig.ChangesDiffKey.addTokens]: {
            color: "green" as DesignKitConfigType.Color,
            description: "Tokens to add to whitelist",
        },

        [TokensWhitelistEditConfig.ChangesDiffKey.removeTokens]: {
            color: "red" as DesignKitConfigType.Color,
            description: "Tokens to remove from whitelist",
        },
    };
}

export { TokensWhitelistEditConfig, type TokensWhitelistEditFeature };
