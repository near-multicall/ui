import { Entity as MIEntity, ModuleContext } from "./module-context";
import { MIAdminsTable } from "./ui/mi-admins";
import { MISettingsProvider } from "./ui/mi-settings-provider";
import { MITokenWhitelistTable } from "./ui/mi-token-whitelist";

export { type MIEntity };

/**
 * Multicall Instance entity
 */
export class MI extends ModuleContext {
    static AdminsTable = MIAdminsTable;
    static TokenWhitelistTable = MITokenWhitelistTable;
    static SettingsProvider = MISettingsProvider;
}
