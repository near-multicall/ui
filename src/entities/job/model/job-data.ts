import { useEffect, useState } from "react";

import { JobData } from "../../../shared/lib/contracts/multicall";
import { type JobEntity } from "../config";
import { JobExtended } from "../lib/job-extended";

type JobDataWithStatus = Omit<JobData, "job"> & {
    job: JobData["job"] & {
        status: JobEntity.Status;
    };
};

type JobsDataFxResponse = {
    data: Record<JobDataWithStatus["id"], JobDataWithStatus> | null;
    error?: Error | null;
    loading: boolean;
};

const jobsDataFx = async (
    { multicall }: JobEntity.dependencies["contracts"],
    callback: (result: JobsDataFxResponse) => void
) =>
    callback(
        await multicall
            .getJobs()
            .then((data) => ({
                data: data.reduce(
                    /** Jobs indexed by ID for easy access to each particular job */
                    (jobsIndexedById, job) => ({ ...jobsIndexedById, [job.id]: JobExtended.withStatus(job) }),
                    {}
                ),

                loading: false,
            }))
            .catch((error) => ({ data: null, error: new Error(error), loading: false }))
    );

const useJobsData = (contracts: JobEntity.dependencies["contracts"]) => {
    const [state, stateUpdate] = useState<JobsDataFxResponse>({ data: null, error: null, loading: true });

    useEffect(() => void jobsDataFx(contracts, stateUpdate), []);

    return state;
};

export class JobDataModel {
    static useAllJobsFrom = useJobsData;
}
