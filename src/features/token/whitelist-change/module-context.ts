import { HTMLProps } from "react";

import { MulticallTokenWhitelistDiffKey, MulticallSettingsDiff } from "../../../shared/lib/contracts/multicall";
import { DesignContext } from "../../../shared/ui/design";

export namespace Feature {
    export type DiffKey = MulticallTokenWhitelistDiffKey;

    export interface Inputs extends Omit<HTMLProps<HTMLDivElement>, "onChange"> {
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

    public static readonly DiffMeta = {
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
