import { ModuleContext } from "./module-context";
import { MIModel } from "./model/multicall-instance.model";
import { MIAdminsTable } from "./ui/multicall-instance.admins";
import { MIContextProvider } from "./ui/multicall-instance.providers";
import { MITokenWhitelistTable } from "./ui/multicall-instance.token-whitelist";

export class MulticallInstance extends ModuleContext {
    static Context = MIModel.Context;
    static ContextProvider = MIContextProvider;
    static AdminsTable = MIAdminsTable;
    static TokenWhitelistTable = MITokenWhitelistTable;
}
