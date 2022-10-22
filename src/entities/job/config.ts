import { type JobData, type Multicall } from "../../shared/lib/contracts/multicall";

export namespace JobEntity {
    export interface Dependencies {
        className?: string;
        contracts: { multicall: Multicall };
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

export class JobConfig {
    static readonly Status = JobEntity.Status;

    static StatusIcons = {
        [JobEntity.Status.Inactive]: "🟡",
        [JobEntity.Status.Expired]: "🔴",
        [JobEntity.Status.Active]: "🟢",
        [JobEntity.Status.Running]: "🟣",
        [JobEntity.Status.Unknown]: "❔",
    };
}
