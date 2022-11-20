import { HTMLProps } from "react";
import { JobSettingsEdit, TokensWhitelistEdit } from "../../features";
import { MulticallConfigDiff, Multicall } from "../../shared/lib/contracts/multicall";
import { SputnikDAO } from "../../shared/lib/contracts/sputnik-dao";

namespace MulticallConfigEditorWidget {
    export interface Inputs extends HTMLProps<HTMLDivElement> {
        contracts: { dao: SputnikDAO; multicall: Multicall };
    }

    export type ChangesDiff = MulticallConfigDiff;

    export type ProposalDescription = Parameters<SputnikDAO["proposeFunctionCall"]>[0];
}

class MulticallConfigEditorConfig {
    public static readonly ChangesDiffKey = {
        ...JobSettingsEdit.ChangesDiffKey,
        ...TokensWhitelistEdit.ChangesDiffKey,
    };

    public static readonly ChangesDiffMetadata = {
        ...JobSettingsEdit.ChangesDiffMetadata,
        ...TokensWhitelistEdit.ChangesDiffMetadata,
    };
}

export { MulticallConfigEditorConfig, type MulticallConfigEditorWidget };
