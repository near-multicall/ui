import { TokenWhitelistEditConfig, type TokenWhitelistEditFeature } from "./config";
import { TokenWhitelistForm } from "./ui/tokens-whitelist-form";

class TokenWhitelistEdit extends TokenWhitelistEditConfig {
    static Form = TokenWhitelistForm;
}

export { TokenWhitelistEdit, type TokenWhitelistEditFeature };
