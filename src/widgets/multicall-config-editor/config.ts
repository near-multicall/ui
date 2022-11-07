import { HTMLProps } from "react";
import { JobSettingsEdit, TokensWhitelistEdit } from "../../features";
import { MulticallConfigDiff, MulticallContract } from "../../shared/lib/contracts/multicall";
import { SputnikDAOContract } from "../../shared/lib/contracts/sputnik-dao";

namespace MulticallConfigEditorWidget {
    export interface Inputs extends HTMLProps<HTMLDivElement> {
        contracts: { dao: SputnikDAOContract; multicall: MulticallContract };
    }

    export type ChangesDiff = MulticallConfigDiff;

    export type ProposalDescription = Parameters<SputnikDAOContract["proposeFunctionCall"]>[0];
}

class MulticallConfigEditorConfig {
    public static readonly ChangesDiffKey = Object.assign(
        JobSettingsEdit.ChangesDiffKey,
        TokensWhitelistEdit.ChangesDiffKey
    );

    public static readonly ChangesDiffKeyDescription = Object.assign(
        JobSettingsEdit.ChangesDiffKeyDescription,
        TokensWhitelistEdit.ChangesDiffKeyDescription
    );
}

export { MulticallConfigEditorConfig, type MulticallConfigEditorWidget };
