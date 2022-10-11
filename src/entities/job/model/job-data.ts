import { useEffect, useState } from "react";
import { Base64 } from "js-base64";

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
                    (jobsIndexedById, job) => {
                        const jobWithStatus = JobExtended.withStatus(job);
                        // base64 decode FunctionCall args
                        jobWithStatus.job.multicalls.forEach((multicallArgs) =>
                            multicallArgs.calls.forEach((call) =>
                                call.forEach((batchCall) =>
                                    batchCall.actions.forEach(
                                        (action) => (action.args = JSON.parse(Base64.decode(action.args)))
                                    )
                                )
                            )
                        );
                        return { ...jobsIndexedById, [job.id]: jobWithStatus };
                    },
                    {}
                ),

                loading: false,
            }))
            .catch((error) => ({ data: null, error: new Error(error), loading: false }))
    );

const useJobsData = (contracts: JobEntity.dependencies["contracts"]) => {
    const [state, stateUpdate] = useState<JobsDataFxResponse>({ data: null, error: null, loading: true });

    useEffect(() => void jobsDataFx(contracts, stateUpdate), []);

    useEffect(() => {
        state.error !== null && void console.error(state.error);
    }, [state]);

    return state;
};

export class JobDataModel {
    static useAllJobsFrom = useJobsData;
}
