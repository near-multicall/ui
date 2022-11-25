import { HTMLProps } from "react";

import { MulticallTokenWhitelistDiffKey, type MulticallSettingsDiff } from "../../../shared/lib/contracts/multicall";
import { MIEntity } from "../../../entities";
import { DesignKitConfigType } from "../../../shared/ui/design";

export namespace TokensWhitelistChange {
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

export class Config {
    public static readonly DiffKey = MulticallTokenWhitelistDiffKey;

    public static readonly DiffMetadata = {
        [Config.DiffKey.addTokens]: {
            color: "green" as DesignKitConfigType.Color,
            description: "Tokens to add to whitelist",
        },

        [Config.DiffKey.removeTokens]: {
            color: "red" as DesignKitConfigType.Color,
            description: "Tokens to remove from whitelist",
        },
    };
}
