import { HTMLProps } from "react";

import { MulticallTokenWhitelistDiffKey, type MulticallSettingsDiff } from "../../../shared/lib/contracts/multicall";
import { MIEntity } from "../../../entities";
import { DesignContext } from "../../../shared/ui/design";

export namespace TokenWhitelistChange {
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

export class ModuleContext {
    public static readonly DiffKey = MulticallTokenWhitelistDiffKey;

    public static readonly DiffMetadata = {
        [ModuleContext.DiffKey.addTokens]: {
            color: "green" as DesignContext.Color,
            description: "Tokens to add to whitelist",
        },

        [ModuleContext.DiffKey.removeTokens]: {
            color: "red" as DesignContext.Color,
            description: "Tokens to remove from whitelist",
        },
    };
}
