import { MulticallConfig, type MulticallEntity } from "./config";
import { MulticallAdminsTable } from "./ui/mc-admins";
import { MulticallTokensWhitelistTable } from "./ui/mc-tokens-whitelist";
import { multicallWhitelistedTokenTableRow } from "./ui/mc-whitelisted-token";

class Multicall extends MulticallConfig {
    static AdminsTable = MulticallAdminsTable;
    static TokensWhitelistTable = MulticallTokensWhitelistTable;
    static whitelistedTokenTableRow = multicallWhitelistedTokenTableRow;
}

export { Multicall, MulticallEntity };
