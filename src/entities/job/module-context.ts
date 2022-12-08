import { JobData, Multicall } from "../../shared/lib/contracts/multicall";

export namespace Entity {
    export interface Inputs {
        className?: string;
        adapters: { multicallInstance: Multicall };
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
    static readonly Status = Entity.Status;

    static StatusIcons = {
        [Entity.Status.Inactive]: "🟡",
        [Entity.Status.Expired]: "🔴",
        [Entity.Status.Active]: "🟢",
        [Entity.Status.Running]: "🟣",
        [Entity.Status.Unknown]: "❔",
    };
}
