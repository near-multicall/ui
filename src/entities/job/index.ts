import { JobModuleContext, type JobModule } from "./context";
import { JobsTable } from "./ui/jobs-table";

class Job extends JobModuleContext {
    static EntriesTable = JobsTable;
}

export { Job, type JobModule };
