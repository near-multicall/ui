import { HTMLProps } from "react";
import { MulticallConfigDiff, MulticallContract } from "../../shared/lib/contracts/multicall";
import { SputnikDAOContract } from "../../shared/lib/contracts/sputnik-dao";

namespace MulticallConfigEditorWidget {
    export interface Dependencies extends HTMLProps<HTMLDivElement> {
        contracts: { dao: SputnikDAOContract; multicall: MulticallContract };
    }

    export type ChangesDiff = MulticallConfigDiff;

    export type ProposalDescription = Parameters<SputnikDAOContract["proposeFunctionCall"]>[0];
}

class MulticallConfigEditorConfig {}

export { MulticallConfigEditorConfig, type MulticallConfigEditorWidget };
