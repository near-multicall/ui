import { type JobData, type Multicall } from "../../shared/lib/contracts/multicall";

export namespace Job {
    export interface Inputs {
        className?: string;
        adapters: { multicall: Multicall };
    }

    export type Data = JobData;
}

export class ModuleContext {
    static StatusIcons: Record<JobData["status"], string> = {
        Inactive: "🟡",
        Expired: "🔴",
        Deleted: "🔴",
        Active: "🟢",
        Finished: "🟢",
        Running: "🟣",
        Unknown: "❔",
    };
}
