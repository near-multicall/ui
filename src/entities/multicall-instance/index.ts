import { ModuleContext } from "./module-context";
import { MIModel } from "./model/mi-model";
import { MIAdminsTable } from "./ui/mi-admins";
import { MIPropertiesProvider } from "./ui/mi-providers";
import { MITokenWhitelistTable } from "./ui/mi-token-whitelist";

export class MulticallInstance extends ModuleContext {
    static AdminsTable = MIAdminsTable;
    static TokenWhitelistTable = MITokenWhitelistTable;
    static PropertiesProvider = MIPropertiesProvider;
    static useProperties = MIModel.useProperties;
}
