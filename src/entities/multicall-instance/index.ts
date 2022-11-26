import { MI as MIModule, MIModuleContext } from "./context";
import { MIAdminsTable } from "./ui/mi-admins";
import { MITokenWhitelistTable } from "./ui/mi-token-whitelist";

/**
 * Multicall Instance entity
 */
class MI extends MIModuleContext {
    static AdminsTable = MIAdminsTable;
    static TokenWhitelistTable = MITokenWhitelistTable;
}

export { MI, type MIModule };
