import { HTMLProps } from "react";

import { MulticallTokenWhitelistDiffKey, MulticallSettingsChange } from "../../../shared/lib/contracts/multicall";
import { DesignContext } from "../../../shared/ui/design";

export namespace Feature {
    export type DiffKey = MulticallTokenWhitelistDiffKey;

    export interface Inputs extends Omit<HTMLProps<HTMLDivElement>, "onChange"> {
        onEdit: (payload: Pick<MulticallSettingsChange, DiffKey>) => void;
        resetTrigger: { subscribe: (callback: EventListener) => () => void };
    }

    export interface FormStates
        extends Record<
            keyof Pick<MulticallSettingsChange, DiffKey>,
            Set<MulticallSettingsChange[keyof Pick<MulticallSettingsChange, DiffKey>][number]>
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
