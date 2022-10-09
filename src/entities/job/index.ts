import { JobConfig } from "./config";
import { JobsList } from "./ui/jobs-list";

export class Job extends JobConfig {
    static ListOfAll = JobsList;
}

export { type JobEntity } from "./config";
