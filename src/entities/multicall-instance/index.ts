import { Entity as MIEntity, ModuleContext } from "./module-context";
import { MIPropertiesModel } from "./model/mi-properties";
import { MIAdminsTable } from "./ui/mi-admins";
import { MIPropertiesProvider } from "./ui/mi-providers";
import { MITokenWhitelistTable } from "./ui/mi-token-whitelist";

export { type MIEntity };

/**
 * Multicall Instance entity
 */
export class MI extends ModuleContext {
    static AdminsTable = MIAdminsTable;
    static TokenWhitelistTable = MITokenWhitelistTable;
    static PropertiesProvider = MIPropertiesProvider;
    static useProperties = MIPropertiesModel.useContext;
}
