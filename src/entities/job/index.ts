import { JobDetails } from "./ui/job-details";
import { JobsList } from "./ui/jobs-list";

export class Job {
    static Details = JobDetails;
    static ListOfAll = JobsList;
}

export { type Dependencies as JobDependencies } from "./config";
