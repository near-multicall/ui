import { HTMLProps } from "react";

import { MulticallInstance, MulticallInstanceEntity } from "../../entities";
import { MulticallConfigDiff, MulticallContract } from "../../shared/lib/contracts/multicall";
import { DesignKitConfigType } from "../../shared/ui/design";

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

    public static readonly ChangesDiffMetadata = {
        [JobSettingsEditConfig.ChangesDiffKey.croncatManager]: {
            color: "blue" as DesignKitConfigType.Color,
            description: "Croncat manager",
        },

        [JobSettingsEditConfig.ChangesDiffKey.jobBond]: {
            color: "blue" as DesignKitConfigType.Color,
            description: "Job bond",
        },
    };
}

export { JobSettingsEditConfig, type JobSettingsEditFeature };
