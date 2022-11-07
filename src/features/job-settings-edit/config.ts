import { HTMLProps } from "react";

import { MulticallInstance, MulticallInstanceEntity } from "../../entities";
import { MulticallConfigDiff, MulticallContract } from "../../shared/lib/contracts/multicall";

namespace JobSettingsEditFeature {
    export type ChangesDiffKey = MulticallInstanceEntity.ParamKey;

    export type FormState = Pick<MulticallConfigDiff, MulticallInstanceEntity.ParamKey>;

    export interface Inputs
        extends Omit<HTMLProps<HTMLDivElement>, "onChange">,
            Pick<MulticallInstanceEntity.Inputs, "daoContractAddress"> {
        multicallContract: MulticallContract;
        onEdit: (payload: FormState) => void;
        resetTrigger: { subscribe: (callback: EventListener) => () => void };
    }
}

class JobSettingsEditConfig {
    public static readonly ChangesDiffKey = MulticallInstance.ParamKey;

    public static readonly ChangesDiffKeyDescription = {
        [JobSettingsEditConfig.ChangesDiffKey.croncatManager]: "Croncat manager",
        [JobSettingsEditConfig.ChangesDiffKey.jobBond]: "Job bond",
    };
}

export { JobSettingsEditConfig, type JobSettingsEditFeature };
