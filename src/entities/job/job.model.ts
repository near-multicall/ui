import { JobData } from "../../shared/lib/contracts/multicall";

export type JobModel = JobData;

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
