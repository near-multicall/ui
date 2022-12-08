import { HTMLProps } from "react";

import { MI, MIEntity } from "../../../entities";
import { MulticallSettingsDiff, Multicall } from "../../../shared/lib/contracts/multicall";
import { DesignContext } from "../../../shared/ui/design";

export namespace Feature {
    export type DiffKey = MIEntity.ParamKey;

    export type FormState = Pick<MulticallSettingsDiff, MIEntity.ParamKey>;

    export interface Inputs extends Omit<HTMLProps<HTMLDivElement>, "onChange"> {
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
