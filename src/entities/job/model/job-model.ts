import { useEffect, useState } from "react";

import { Job } from "../module-context";
import { JobNormalized } from "../lib/job-normalized";

type JobAllEntries = {
    /** Jobs indexed by ID for easy access to each particular job */
    data: Record<Job.DataWithStatus["id"], Job.DataWithStatus> | null;
    error?: Error | null;
    loading: boolean;
};

export class JobModel {
    static allEntriesFetchFx = async (
        { multicallInstance }: Job.Inputs["adapters"],
        callback: (result: JobAllEntries) => void
    ) =>
        callback(
            await multicallInstance
                .getJobs()
                .then((data) => ({
                    data: data.reduce(
                        (jobsIndexedById, job) => ({
                            ...jobsIndexedById,
                            [job.id]: JobNormalized.withMulticallsDataDecoded(JobNormalized.withStatus(job)),
                        }),
                        {}
                    ),

                    error: null,
                    loading: false,
                }))
                .catch((error) => ({
                    data: null,
                    error: new Error(error),
                    loading: false,
                }))
        );

    static useAllEntries = (adapters: Job.Inputs["adapters"]) => {
        const [state, stateUpdate] = useState<JobAllEntries>({ data: null, error: null, loading: true });

        useEffect(() => void JobModel.allEntriesFetchFx(adapters, stateUpdate), [adapters, stateUpdate]);

        useEffect(() => {
            state.error instanceof Error && void console.error(state.error);
        }, [state]);

        return state;
    };
}
