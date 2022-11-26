import { useEffect, useState } from "react";

import { type JobModule } from "../context";
import { JobNormalized } from "../lib/job-normalized";

type JobAllEntries = {
    /** Jobs indexed by ID for easy access to each particular job */
    data: Record<JobModule.DataWithStatus["id"], JobModule.DataWithStatus> | null;
    error?: Error | null;
    loading: boolean;
};

export class JobModel {
    static allEntriesFetchFx = async (
        { multicall }: JobModule.Inputs["contracts"],
        callback: (result: JobAllEntries) => void
    ) =>
        callback(
            await multicall
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

    static useAllEntries = (contracts: JobModule.Inputs["contracts"]) => {
        const [state, stateUpdate] = useState<JobAllEntries>({ data: null, error: null, loading: true });

        useEffect(() => void JobModel.allEntriesFetchFx(contracts, stateUpdate), [contracts, stateUpdate]);

        useEffect(() => {
            state.error instanceof Error && void console.error(state.error);
        }, [state]);

        return state;
    };
}
