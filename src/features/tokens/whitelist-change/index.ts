import { Config, type TokenWhitelistChange as TWChangeFeature } from "./config";
import { TokenWhitelistForm } from "./ui/tokens-whitelist-form";

export class TokenWhitelistChange extends Config {
    static Form = TokenWhitelistForm;
}

export { type TWChangeFeature };
