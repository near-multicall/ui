import { MulticallInstance } from "../../../entities";
import { DesignContext } from "../../../shared/ui/design";

export class ModuleContext {
    public static readonly DiffKey = MulticallInstance.ParamKey;

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
