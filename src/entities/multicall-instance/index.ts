import { MI as MIEntity, MIConfig } from "./config";
import { MIAdminsTable } from "./ui/mi-admins";
import { MITokenWhitelistTable } from "./ui/mi-token-whitelist";

/**
 * Multicall Instance entity
 */
class MI extends MIConfig {
    static AdminsTable = MIAdminsTable;
    static TokenWhitelistTable = MITokenWhitelistTable;
}

export { MI, type MIEntity };
