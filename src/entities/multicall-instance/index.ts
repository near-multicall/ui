import { MIEntityConfig, type MIEntity } from "./config";
import { MIAdminsTable } from "./ui/mi-admins";
import { MITokensWhitelistTable } from "./ui/mi-tokens-whitelist";

/**
 * Multicall Instance entity
 */
class MI extends MIEntityConfig {
    static AdminsTable = MIAdminsTable;
    static TokensWhitelistTable = MITokensWhitelistTable;
}

export { MI, MIEntity };
