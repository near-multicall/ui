import { JobModuleContext, type JobEntity } from "./context";
import { JobsTable } from "./ui/jobs-table";

class Job extends JobModuleContext {
    static EntriesTable = JobsTable;
}

export { Job, type JobEntity };
