import { HTMLProps } from "react";
import { JobSettingsEditFeature, TokensWhitelistEditFeature } from "../../features";
import { MulticallContract } from "../../shared/lib/contracts/multicall";
import { SputnikDAOContract } from "../../shared/lib/contracts/sputnik-dao";

namespace MulticallConfigEditorWidget {
    export interface Dependencies extends HTMLProps<HTMLDivElement> {
        contracts: { dao: SputnikDAOContract; multicall: MulticallContract };
    }
}

class MulticallConfigEditorConfig {}

export { MulticallConfigEditorConfig, type MulticallConfigEditorWidget };
