import { HTMLProps } from "react";

import { MulticallInstanceEntity } from "../../entities";
import { MulticallContract } from "../../shared/lib/contracts/multicall";

namespace JobSettingsEditFeature {
    export interface Dependencies
        extends Omit<HTMLProps<HTMLDivElement>, "onChange">,
            Pick<MulticallInstanceEntity.Dependencies, "controllerContractAddress"> {
        multicallContract: MulticallContract;
        onEdit: (payload: FormState) => void;
    }

    export type FormState = Pick<MulticallInstanceEntity.ConfigChanges, "croncatManager" | "jobBond">;
}

export { type JobSettingsEditFeature };
