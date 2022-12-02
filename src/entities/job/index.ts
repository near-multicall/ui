import { ModuleContext, Job as JobModule } from "./module-context";
import { JobsTable } from "./ui/jobs-table";

export { type JobModule };

export class Job extends ModuleContext {
    static EntriesTable = JobsTable;
}
