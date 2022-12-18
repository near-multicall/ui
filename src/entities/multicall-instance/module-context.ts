import { MulticallPropertyKey, MulticallTokenWhitelistDiffKey } from "../../shared/lib/contracts/multicall";
import { toYocto } from "../../shared/lib/converter";
import { Color } from "../../shared/ui/design";

export class ModuleContext {
    public static readonly ParamKey = MulticallPropertyKey;

    /**
     * Minimum balance needed for storage + state.
     */
    public static readonly MIN_BALANCE = toYocto(1);

    public static readonly SettingsDiffMeta = {
        [MulticallPropertyKey.croncatManager]: {
            color: "blue" as Color,
            description: "Croncat manager",
        },

        [MulticallPropertyKey.jobBond]: {
            color: "blue" as Color,
            description: "Job bond",
        },

        [MulticallTokenWhitelistDiffKey.addTokens]: {
            color: "green" as Color,
            description: "Tokens to add to whitelist",
        },

        [MulticallTokenWhitelistDiffKey.removeTokens]: {
            color: "red" as Color,
            description: "Tokens to remove from whitelist",
        },
    };
}
