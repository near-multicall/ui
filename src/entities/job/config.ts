import { Multicall } from "../../shared/lib/contracts/multicall";

export namespace JobEntity {
    export interface dependencies {
        className: string;
        contracts: { multicall: Multicall };
    }

    export enum Status {
        Inactive = "Inactive",
        Expired = "Expired",
        Active = "Active",
        Running = "Running",
        Unknown = "Unknown",
    }
}

export class JobConfig {
    static readonly Status = JobEntity.Status;
}
