import { toYocto } from "../../shared/lib/converter";
import { Color } from "../../shared/ui/design";

export class ModuleContext {
    /**
     * Minimum balance needed for storage + state.
     */
    public static readonly MIN_BALANCE = toYocto(1);

    public static readonly SettingsDiffMeta = {
        addTokens: {
            color: "green" as Color,
            description: "Tokens to add to whitelist",
        },

        jobBond: {
            color: "blue" as Color,
            description: "Job bond",
        },

        removeTokens: {
            color: "red" as Color,
            description: "Tokens to remove from whitelist",
        },
    };
}