import { HTMLProps } from "react";

import { MI, MIModule } from "../../../entities";
import { MulticallSettingsDiff, Multicall } from "../../../shared/lib/contracts/multicall";
import { DesignContext } from "../../../shared/ui/design";

export namespace SchedulingSettingsChange {
    export type DiffKey = MIModule.ParamKey;

    export type FormState = Pick<MulticallSettingsDiff, MIModule.ParamKey>;

    export interface Inputs extends Omit<HTMLProps<HTMLDivElement>, "onChange">, Pick<MIModule.Inputs, "daoAddress"> {
        adapters: {
            multicallInstance: Multicall;
        };

        onEdit: (payload: FormState) => void;
        resetTrigger: { subscribe: (callback: EventListener) => () => void };
    }
}

export class ModuleContext {
    public static readonly DiffKey = MI.ParamKey;

    public static readonly DiffMeta = {
        [ModuleContext.DiffKey.croncatManager]: {
            color: "blue" as DesignContext.Color,
            description: "Croncat manager",
        },

        [ModuleContext.DiffKey.jobBond]: {
            color: "blue" as DesignContext.Color,
            description: "Job bond",
        },
    };
}
