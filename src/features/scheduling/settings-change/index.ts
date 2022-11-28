import { ModuleContext, type SchedulingSettingsChange as SchedulingSettingsChangeModule } from "./context";
import { SchedulingSettingsForm } from "./ui/scheduling-settings-form";

export class SchedulingSettingsChange extends ModuleContext {
    static Form = SchedulingSettingsForm;
}

export { type SchedulingSettingsChangeModule };
