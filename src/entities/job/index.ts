import { JobInfo } from "./ui/job-info";
import { JobsList } from "./ui/jobs-list";

export class Job {
    static Info = JobInfo;
    static ListOfAll = JobsList;
}

export { type Dependencies as JobDependencies } from "./config";
