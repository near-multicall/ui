import { useEffect, useState } from "react";

import { type JobEntity } from "../config";
import { JobNormalized } from "../lib/job-normalized";

type JobAllEntriesFetchFxResponse = {
    /** Jobs indexed by ID for easy access to each particular job */
    data: Record<JobEntity.DataWithStatus["id"], JobEntity.DataWithStatus> | null;
    error?: Error | null;
    loading: boolean;
};

export class JobDataModel {
    static allEntriesFetchFx = async (
        { multicall }: JobEntity.Dependencies["contracts"],
        callback: (result: JobAllEntriesFetchFxResponse) => void
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

    static useAllEntries = (contracts: JobEntity.Dependencies["contracts"]) => {
        const [state, stateUpdate] = useState<JobAllEntriesFetchFxResponse>({ data: null, error: null, loading: true });

        useEffect(() => void JobDataModel.allEntriesFetchFx(contracts, stateUpdate), [contracts, stateUpdate]);

        useEffect(() => {
            state.error instanceof Error && void console.error(state.error);
        }, [state]);

        return state;
    };
}
