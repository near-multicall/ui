import { JobData as JobDataOrig } from "../../shared/lib/contracts/multicall";

export type JobModel = { raw: JobData; normalized: JobData };
export type JobData = JobDataOrig;

export const JobsSchema: {
    /**
     * Jobs indexed by ID for easy access to each particular job
     */
    data: Record<JobData["id"], JobModel> | null;
    error?: Error | null;
    loading: boolean;
} = {
    data: null,
    error: null,
    loading: true,
};
