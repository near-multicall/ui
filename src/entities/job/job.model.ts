import { JobData } from "../../shared/lib/contracts/multicall";

export type JobModel = Omit<JobData, "job"> & {
    job: JobData["job"] & {
        status: "inactive" | "expired" | "active" | "running" | "unknown";
    };
};

export const JobsSchema: {
    /**
     * Jobs indexed by ID for easy access to each particular job
     */
    data: Record<JobModel["id"], JobModel> | null;
    error?: Error | null;
    loading: boolean;
} = {
    data: null,
    error: null,
    loading: true,
};
