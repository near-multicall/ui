import { useEffect, useState } from "react";
import { JobData } from "../../../shared/lib/contracts/multicall";

import { Dependencies } from "../config";

type JobDataWithStats = {
    id: JobData["id"];

    job: JobData["job"] & {
        status: "Active" | "Expired" | "Inactive" | "Running";
    };
};

type JobsDataFxResponse = {
    data: Record<JobDataWithStats["id"], JobDataWithStats> | null;
    error?: Error | null;
    loading: boolean;
};

const jobsDataFx = async ({ multicall }: Dependencies["contracts"], callback: (result: JobsDataFxResponse) => void) =>
    callback(
        await multicall
            .getJobs()
            .then((data) => ({
                /** Jobs indexed by ID for easy access to each particular job */
                data: data.reduce(
                    (jobsRegistry, { id, job }) => ({
                        ...jobsRegistry,
                        [id]: {
                            id,
                            job: {
                                ...job,
                                /** Calculation from `job.is_active` and `job_run_count` goes here */
                                status: "Inactive",
                            },
                        },
                    }),
                    {}
                ),
                loading: false,
            }))
            .catch((error) => ({ data: null, error: new Error(error), loading: false }))
    );

const useJobsData = (contracts: Dependencies["contracts"]) => {
    const [state, stateUpdate] = useState<JobsDataFxResponse>({ data: null, error: null, loading: true });

    useEffect(() => void jobsDataFx(contracts, stateUpdate), []);

    return state;
};

export class JobDataModel {
    static useAllJobsFrom = useJobsData;
}
