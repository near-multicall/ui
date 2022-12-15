import { MulticallInstance } from "../../entities";
import { Color } from "../../shared/ui/design";

export class ModuleContext {
    public static readonly DiffKey = MulticallInstance.ParamKey;

    public static readonly DiffMeta = {
        [ModuleContext.DiffKey.croncatManager]: {
            color: "blue" as Color,
            description: "Croncat manager",
        },

        [ModuleContext.DiffKey.jobBond]: {
            color: "blue" as Color,
            description: "Job bond",
        },
    };
}
