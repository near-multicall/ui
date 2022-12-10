import { Entity as MIEntity, ModuleContext } from "./module-context";
import { MIAdminsTable } from "./ui/mi-admins";
import { MISettingsProvider } from "./ui/providers";
import { MITokenWhitelistTable } from "./ui/mi-token-whitelist";
import { MISettingsModel } from "./model/mi-settings";

export { type MIEntity };

/**
 * Multicall Instance entity
 */
export class MI extends ModuleContext {
    static AdminsTable = MIAdminsTable;
    static TokenWhitelistTable = MITokenWhitelistTable;
    static SettingsProvider = MISettingsProvider;
    static useSettings = MISettingsModel.useContext;
}
