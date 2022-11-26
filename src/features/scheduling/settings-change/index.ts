import { ModuleContext, type SchedulingSettingsChange as SSChangeFeature } from "./context";
import { SchedulingSettingsForm } from "./ui/scheduling-settings-form";

export class SchedulingSettingsChange extends ModuleContext {
    static Form = SchedulingSettingsForm;
}

export { type SSChangeFeature };
