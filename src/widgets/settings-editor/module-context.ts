import { SchedulingSettingsChange, TokenWhitelistChange } from "../../features";

export class ModuleContext {
    public static readonly DiffKey = {
        ...SchedulingSettingsChange.DiffKey,
        ...TokenWhitelistChange.DiffKey,
    };

    public static readonly DiffMeta = {
        ...SchedulingSettingsChange.DiffMeta,
        ...TokenWhitelistChange.DiffMeta,
    };
}
