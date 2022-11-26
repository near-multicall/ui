import { type JobData, type Multicall } from "../../shared/lib/contracts/multicall";

namespace JobModule {
    export interface Inputs {
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

class JobModuleContext {
    static readonly Status = JobModule.Status;

    static StatusIcons = {
        [JobModule.Status.Inactive]: "🟡",
        [JobModule.Status.Expired]: "🔴",
        [JobModule.Status.Active]: "🟢",
        [JobModule.Status.Running]: "🟣",
        [JobModule.Status.Unknown]: "❔",
    };
}

export { JobModuleContext, type JobModule };
