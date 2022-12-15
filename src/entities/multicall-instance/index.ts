import { ModuleContext } from "./module-context";
import { MIModel } from "./model/mi-model";
import { MIAdminsTable } from "./ui/mi-admins";
import { MIContextProvider } from "./ui/mi-providers";
import { MITokenWhitelistTable } from "./ui/mi-token-whitelist";

export class MulticallInstance extends ModuleContext {
    static Context = MIModel.Context;
    static ContextProvider = MIContextProvider;
    static AdminsTable = MIAdminsTable;
    static TokenWhitelistTable = MITokenWhitelistTable;
}
