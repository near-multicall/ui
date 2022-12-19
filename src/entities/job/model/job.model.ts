import { useEffect, useMemo, useState } from "react";

import { JobData, Multicall } from "../../../shared/lib/contracts/multicall";
import { JobFormat } from "../lib/job.format";

export interface JobModelInputs {
    multicallInstance: Multicall;
}

export enum JobStatus {
    Inactive = "Inactive",
    Expired = "Expired",
    Active = "Active",
    Running = "Running",
    Unknown = "Unknown",
}

export type JobDataWithStatus = Omit<JobData, "job"> & {
    job: JobData["job"] & { status: JobStatus };
};

export class JobModel {
    public static readonly allEntries: {
        /** Jobs indexed by ID for easy access to each particular job */
        data: Record<JobDataWithStatus["id"], JobDataWithStatus> | null;
        error?: Error | null;
        loading: boolean;
    } = {
        data: null,
        error: null,
        loading: true,
    };

    private static readonly allEntriesFetch = async (
        { multicallInstance }: JobModelInputs,
        callback: (result: typeof JobModel.allEntries) => void
    ) =>
        callback(
            await multicallInstance
                .getJobs()
                .then((data) => ({
                    data: data.reduce(
                        (jobsIndexedById, job) => ({
                            ...jobsIndexedById,
                            [job.id]: JobFormat.withMulticallsDataDecoded(JobFormat.withStatus(job)),
                        }),
                        {}
                    ),

                    error: null,
                    loading: false,
                }))
                .catch((error) => ({ data: null, error, loading: false }))
        );

    public static readonly useAllEntriesState = (inputs: JobModelInputs) => {
        const [state, stateUpdate] = useState(JobModel.allEntries);

        useEffect(() => void JobModel.allEntriesFetch(inputs, stateUpdate), [...Object.values(inputs), stateUpdate]);

        useEffect(() => {
            state.error instanceof Error && void console.error(state.error);
        }, [state.error]);

        return useMemo(() => state, [...Object.values(inputs), state]);
    };
}
