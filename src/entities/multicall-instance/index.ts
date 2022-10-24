import { type MulticallInstanceEntity, MIEntityConfig } from "./config";
import { MIAdminsTable } from "./ui/mi-admins";
import { MITokensWhitelistTable } from "./ui/mi-tokens-whitelist";

/**
 * Multicall Instance entity
 */
class MulticallInstance extends MIEntityConfig {
    static AdminsTable = MIAdminsTable;
    static TokensWhitelistTable = MITokensWhitelistTable;
}

export { MulticallInstance, MulticallInstanceEntity };
