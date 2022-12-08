import { ModuleContext, Feature as TokenWhitelistChangeFeature } from "./module-context";
import { Form } from "./ui/token-whitelist-change";

export { type TokenWhitelistChangeFeature };

export class TokenWhitelistChange extends ModuleContext {
    public static readonly Form = Form;
}
