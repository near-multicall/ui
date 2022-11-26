import { type JobData, type Multicall } from "../../shared/lib/contracts/multicall";

export namespace Job {
    export interface Inputs {
        className?: string;
        adapters: { multicall: Multicall };
    }

    export type Data = JobData;

    export enum Status {
        Inactive = "Inactive",
        Expired = "Expired",
        Active = "Active",
        Running = "Running",
        Unknown = "Unknown",
    }

    export type DataWithStatus = Omit<Data, "job"> & {
        job: Data["job"] & { status: Status };
    };
}

export class ModuleContext {
    static readonly Status = Job.Status;

    static StatusIcons = {
        [Job.Status.Inactive]: "🟡",
        [Job.Status.Expired]: "🔴",
        [Job.Status.Active]: "🟢",
        [Job.Status.Running]: "🟣",
        [Job.Status.Unknown]: "❔",
    };
}
