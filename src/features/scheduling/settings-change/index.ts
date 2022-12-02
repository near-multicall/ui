import { ModuleContext, type SchedulingSettingsChange as SchedulingSettingsChangeModule } from "./module-context";
import { SchedulingSettingsForm } from "./ui/scheduling-settings-form";

export class SchedulingSettingsChange extends ModuleContext {
    static Form = SchedulingSettingsForm;
}

export { type SchedulingSettingsChangeModule };
