import { MulticallConfig, type MulticallEntity } from "./config";
import { MulticallAdminsTable } from "./ui/mc-admins";
import { MulticallTokensWhitelistTable } from "./ui/mc-tokens-whitelist";

class Multicall extends MulticallConfig {
    static AdminsTable = MulticallAdminsTable;
    static TokensWhitelistTable = MulticallTokensWhitelistTable;
}

export { Multicall, MulticallEntity };
