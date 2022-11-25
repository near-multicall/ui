import { HTMLProps } from "react";

import { SchedulingSettingsChange, TokensWhitelistChange } from "../../features";
import { MulticallSettingsDiff, Multicall } from "../../shared/lib/contracts/multicall";
import { SputnikDAO } from "../../shared/lib/contracts/sputnik-dao";

export namespace SettingsEditor {
    export interface Inputs extends HTMLProps<HTMLDivElement> {
        contracts: { dao: SputnikDAO; multicall: Multicall };
    }

    export type Diff = MulticallSettingsDiff;

    export type ProposalDescription = Parameters<SputnikDAO["proposeFunctionCall"]>[0];
}

export class Config {
    public static readonly DiffKey = {
        ...SchedulingSettingsChange.DiffKey,
        ...TokensWhitelistChange.DiffKey,
    };

    public static readonly DiffMetadata = {
        ...SchedulingSettingsChange.DiffMetadata,
        ...TokensWhitelistChange.DiffMetadata,
    };
}