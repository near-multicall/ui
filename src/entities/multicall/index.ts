import { MulticallConfig, type MulticallEntity } from "./config";
import { MulticallTokensWhitelist } from "./ui/tokens-whitelist";

class Multicall extends MulticallConfig {
    static TokensWhitelist = MulticallTokensWhitelist;
}

export { Multicall, MulticallEntity };
