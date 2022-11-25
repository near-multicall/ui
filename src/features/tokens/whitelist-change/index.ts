import { Config, type TokensWhitelistChange as TWChangeFeature } from "./config";
import { TokensWhitelistForm } from "./ui/tokens-whitelist-form";

export class TokensWhitelistChange extends Config {
    static Form = TokensWhitelistForm;
}

export { type TWChangeFeature };
