import { Config, type SchedulingSettingsChange as SSChangeFeature } from "./config";
import { SchedulingSettingsForm } from "./ui/scheduling-settings-form";

export class SchedulingSettingsChange extends Config {
    static Form = SchedulingSettingsForm;
}

export { type SSChangeFeature };
