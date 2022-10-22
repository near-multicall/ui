import { useEffect, useState } from "react";

import { type JobEntity } from "../config";
import { JobNormalized } from "../lib/job-normalized";

const jobsDataInitialState = {
    data: null,
    error: null,
    loading: true,
};

type JobsDataFxResponse = {
    /** Jobs indexed by ID for easy access to each particular job */
    data: Record<JobEntity.DataWithStatus["id"], JobEntity.DataWithStatus> | null;
    error?: Error | null;
    loading: boolean;
};

const jobsDataFx = async (
    { multicall }: JobEntity.Dependencies["contracts"],
    callback: (result: JobsDataFxResponse) => void
) =>
    callback(
        await multicall
            .getJobs()
            .then((data) => ({
                ...jobsDataInitialState,
                loading: false,

                data: data.reduce(
                    (jobsIndexedById, job) => ({
                        ...jobsIndexedById,
                        [job.id]: JobNormalized.withMulticallsDataDecoded(JobNormalized.withStatus(job)),
                    }),
                    {}
                ),
            }))
            .catch((error) => ({ ...jobsDataInitialState, error, loading: false }))
    );

const useJobsData = (contracts: JobEntity.Dependencies["contracts"]) => {
    const [state, stateUpdate] = useState<JobsDataFxResponse>(jobsDataInitialState);

    useEffect(() => void jobsDataFx(contracts, stateUpdate), []);

    useEffect(() => {
        state.error instanceof Error && void console.error(state.error);
    }, [state]);

    return state;
};

export class JobDataModel {
    static useAllJobsFrom = useJobsData;
}
