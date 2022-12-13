import { ModuleContext, Feature as TokenWhitelistChangeFeature } from "./module-context";
import { TokenWhitelistChangeUI } from "./ui/token-whitelist-change";

export { type TokenWhitelistChangeFeature };

export class TokenWhitelistChange extends ModuleContext {
    public static readonly UI = TokenWhitelistChangeUI;
}
