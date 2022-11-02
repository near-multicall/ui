import { JobSettingsEditConfig, type JobSettingsEditFeature } from "./config";
import { JobSettingsForm } from "./ui/job-settings-form";

class JobSettingsEdit extends JobSettingsEditConfig {
    static Form = JobSettingsForm;
}

export { JobSettingsEdit, type JobSettingsEditFeature };
