import { JobConfig, type JobEntity } from "./config";
import { JobsList } from "./ui/jobs-list";

class Job extends JobConfig {
    static ListOfAll = JobsList;
}

export { Job, type JobEntity };
