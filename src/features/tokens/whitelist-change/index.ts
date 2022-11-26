import { ModuleContext, type TokenWhitelistChange as TWChangeFeature } from "./context";
import { TokenWhitelistForm } from "./ui/tokens-whitelist-form";

export class TokenWhitelistChange extends ModuleContext {
    static Form = TokenWhitelistForm;
}

export { type TWChangeFeature };
