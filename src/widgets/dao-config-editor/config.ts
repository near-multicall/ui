import { HTMLProps } from "react";

import { MulticallContract } from "../../shared/lib/contracts/multicall";
import { SputnikDAOContract } from "../../shared/lib/contracts/sputnik-dao";

namespace DaoConfigEditorWidget {
    export interface Dependencies extends HTMLProps<HTMLDivElement> {
        daoContractAddress: SputnikDAOContract["address"];
        multicallContract: MulticallContract;
    }
}

class DaoConfigEditorConfig {}

export { DaoConfigEditorConfig, type DaoConfigEditorWidget };
