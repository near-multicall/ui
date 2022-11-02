import { TokensWhitelistEditConfig, type TokensWhitelistEditFeature } from "./config";
import { TokensWhitelistForm } from "./ui/tokens-whitelist-form";

class TokensWhitelistEdit extends TokensWhitelistEditConfig {
    static Form = TokensWhitelistForm;
}

export { TokensWhitelistEdit, type TokensWhitelistEditFeature };
