import { HTMLProps } from "react";

import { MulticallInstanceEntity } from "../../entities";

import {
    type MulticallConfigDiff,
    MulticallConfigParamKey,
    MulticallContract,
} from "../../shared/lib/contracts/multicall";

namespace JobSettingsEditFeature {
    export type DiffKey = MulticallConfigParamKey;

    export type FormState = Pick<MulticallConfigDiff, MulticallConfigParamKey>;

    export interface Dependencies
        extends Omit<HTMLProps<HTMLDivElement>, "onChange">,
            Pick<MulticallInstanceEntity.Dependencies, "daoContractAddress"> {
        multicallContract: MulticallContract;
        onEdit: (payload: FormState) => void;
        resetTrigger: { subscribe: (callback: EventListener) => () => void };
    }
}

class JobSettingsEditConfig {
    static DiffKey = MulticallConfigParamKey;
}

export { JobSettingsEditConfig, type JobSettingsEditFeature };
