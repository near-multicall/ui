import { MulticallTokenWhitelistDiffKey } from "../../shared/lib/contracts/multicall";
import { Color } from "../../shared/ui/design";

export class ModuleContext {
    public static readonly DiffKey = MulticallTokenWhitelistDiffKey;

    public static readonly DiffMeta = {
        [ModuleContext.DiffKey.addTokens]: {
            color: "green" as Color,
            description: "Tokens to add to whitelist",
        },

        [ModuleContext.DiffKey.removeTokens]: {
            color: "red" as Color,
            description: "Tokens to remove from whitelist",
        },
    };
}
