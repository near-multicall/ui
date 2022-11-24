import { HTMLProps } from "react";

import { MulticallTokenWhitelistDiffKey, type MulticallSettingsDiff } from "../../shared/lib/contracts/multicall";
import { MIEntity } from "../../entities";
import { DesignKitConfigType } from "../../shared/ui/design";

namespace TokenWhitelistEditFeature {
    export type DiffKey = MulticallTokenWhitelistDiffKey;

    export interface Inputs extends Omit<HTMLProps<HTMLDivElement>, "onChange">, MIEntity.Inputs {
        onEdit: (payload: Pick<MulticallSettingsDiff, DiffKey>) => void;
        resetTrigger: { subscribe: (callback: EventListener) => () => void };
    }

    export interface FormStates
        extends Record<
            keyof Pick<MulticallSettingsDiff, DiffKey>,
            Set<MulticallSettingsDiff[keyof Pick<MulticallSettingsDiff, DiffKey>][number]>
        > {}
}

class TokenWhitelistEditConfig {
    public static readonly DiffKey = MulticallTokenWhitelistDiffKey;

    public static readonly DiffMetadata = {
        [TokenWhitelistEditConfig.DiffKey.addTokens]: {
            color: "green" as DesignKitConfigType.Color,
            description: "Tokens to add to whitelist",
        },

        [TokenWhitelistEditConfig.DiffKey.removeTokens]: {
            color: "red" as DesignKitConfigType.Color,
            description: "Tokens to remove from whitelist",
        },
    };
}

export { TokenWhitelistEditConfig, type TokenWhitelistEditFeature };
