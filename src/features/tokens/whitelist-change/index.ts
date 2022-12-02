import { ModuleContext, type TokenWhitelistChange as TokenWhitelistChangeModule } from "./module-context";
import { TokenWhitelistForm } from "./ui/tokens-whitelist-form";

export class TokenWhitelistChange extends ModuleContext {
    static Form = TokenWhitelistForm;
}

export { type TokenWhitelistChangeModule };
