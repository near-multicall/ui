import { HTMLProps } from "react";

import { MulticallContract } from "../../shared/lib/contracts/multicall";
import { SputnikDAOContract } from "../../shared/lib/contracts/sputnik-dao";

namespace MIEntityConfigEditorWidget {
    export interface Dependencies extends HTMLProps<HTMLDivElement> {
        controllerContractAddress: SputnikDAOContract["address"];
        multicallContract: MulticallContract;
    }
}

class MIEntityConfigEditorConfig {}

export { MIEntityConfigEditorConfig, type MIEntityConfigEditorWidget };
