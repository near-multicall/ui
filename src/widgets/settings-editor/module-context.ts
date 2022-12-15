import { ManageScheduleSettings, ManageTokenWhitelist } from "../../features";

export class ModuleContext {
    public static readonly DiffKey = {
        ...ManageScheduleSettings.DiffKey,
        ...ManageTokenWhitelist.DiffKey,
    };

    public static readonly DiffMeta = {
        ...ManageScheduleSettings.DiffMeta,
        ...ManageTokenWhitelist.DiffMeta,
    };
}
