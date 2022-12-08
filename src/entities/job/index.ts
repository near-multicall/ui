import { ModuleContext, Entity as JobEntity } from "./module-context";
import { JobsTable } from "./ui/jobs-table";

export { type JobEntity };

export class Job extends ModuleContext {
    static EntriesTable = JobsTable;
}
