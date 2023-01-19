import { MIParams } from "./mi.params";
import { MIService } from "./mi.service";
import { MIAdminsTable, MIContextProvider, MITokenWhitelistTable } from "./mi.ui";

export class MI extends MIParams {
    static Context = MIService.Context;
    static ContextProvider = MIContextProvider;
    static AdminsTable = MIAdminsTable;
    static TokenWhitelistTable = MITokenWhitelistTable;
}
