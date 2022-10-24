import { HTMLProps } from "react";

import { MulticallInstanceEntity } from "../../entities";
import { MulticallContract } from "../../shared/lib/contracts/multicall";

namespace JobsSettingsEditFeature {
    export interface Dependencies
        extends Omit<HTMLProps<HTMLDivElement>, "onChange">,
            Pick<MulticallInstanceEntity.Dependencies, "controllerContractAddress"> {
        multicallContract: MulticallContract;
        onEdit: (payload: Pick<MulticallInstanceEntity.ConfigChanges, "croncatManager" | "jobBond">) => void;
    }
}

export { type JobsSettingsEditFeature };
