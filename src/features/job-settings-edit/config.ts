import { HTMLProps } from "react";

import { MI, MIEntity } from "../../entities";
import { MulticallSettingsDiff, Multicall } from "../../shared/lib/contracts/multicall";
import { DesignKitConfigType } from "../../shared/ui/design";

namespace JobSettingsEditFeature {
    export type DiffKey = MIEntity.ParamKey;

    export type FormState = Pick<MulticallSettingsDiff, MIEntity.ParamKey>;

    export interface Inputs extends Omit<HTMLProps<HTMLDivElement>, "onChange">, Pick<MIEntity.Inputs, "daoAddress"> {
        multicallInstance: Multicall;
        onEdit: (payload: FormState) => void;
        resetTrigger: { subscribe: (callback: EventListener) => () => void };
    }
}

class JobSettingsEditConfig {
    public static readonly DiffKey = MI.ParamKey;

    public static readonly DiffMetadata = {
        [JobSettingsEditConfig.DiffKey.croncatManager]: {
            color: "blue" as DesignKitConfigType.Color,
            description: "Croncat manager",
        },

        [JobSettingsEditConfig.DiffKey.jobBond]: {
            color: "blue" as DesignKitConfigType.Color,
            description: "Job bond",
        },
    };
}

export { JobSettingsEditConfig, type JobSettingsEditFeature };
