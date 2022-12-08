import { ModuleContext, Feature as SchedulingSettingsChangeFeature } from "./module-context";
import { Form } from "./ui/scheduling-settings-change";

export { type SchedulingSettingsChangeFeature };

export class SchedulingSettingsChange extends ModuleContext {
    public static readonly Form = Form;
}
