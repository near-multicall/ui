import { JobConfig, type JobEntity } from "./config";
import { JobsTable } from "./ui/jobs-table";

class Job extends JobConfig {
    static EntriesTable = JobsTable;
}

export { Job, type JobEntity };
