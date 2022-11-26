import { HTMLProps } from "react";

import { SchedulingSettingsChange, TokenWhitelistChange } from "../../features";
import { MulticallSettingsDiff, Multicall } from "../../shared/lib/contracts/multicall";
import { SputnikDAO } from "../../shared/lib/contracts/sputnik-dao";

export namespace SettingsEditor {
    export interface Inputs extends HTMLProps<HTMLDivElement> {
        contracts: { dao: SputnikDAO; multicall: Multicall };
    }

    export type Diff = MulticallSettingsDiff;

    export type ProposalDescription = Parameters<SputnikDAO["proposeFunctionCall"]>[0];
}

export class ModuleContext {
    public static readonly DiffKey = {
        ...SchedulingSettingsChange.DiffKey,
        ...TokenWhitelistChange.DiffKey,
    };

    public static readonly DiffMeta = {
        ...SchedulingSettingsChange.DiffMeta,
        ...TokenWhitelistChange.DiffMeta,
    };
}
