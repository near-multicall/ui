import { useEffect, useState } from "react";
import { Base64 } from "js-base64";

import { type JobEntity } from "../config";
import { JobExtended } from "../lib/job-extended";

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
                data: data.reduce(
                    (jobsIndexedById, job) => ({
                        ...jobsIndexedById,

                        [job.id]: JobExtended.withStatus(job).job.multicalls.forEach((multicallArgs) =>
                            multicallArgs.calls.forEach((call) =>
                                call.forEach((batchCall) =>
                                    batchCall.actions.forEach(
                                        /** base64 decode FunctionCall args */
                                        (action) => (action.args = JSON.parse(Base64.decode(action.args)))
                                    )
                                )
                            )
                        ),
                    }),

                    {}
                ),

                error: null,
                loading: false,
            }))
            .catch((error) => ({ data: null, error: new Error(error), loading: false }))
    );

const useJobsData = (contracts: JobEntity.Dependencies["contracts"]) => {
    const [state, stateUpdate] = useState<JobsDataFxResponse>({ data: null, error: null, loading: true });

    useEffect(() => void jobsDataFx(contracts, stateUpdate), []);

    useEffect(() => {
        state.error instanceof Error && void console.error(state.error);
    }, [state]);

    return state;
};

export class JobDataModel {
    static useAllJobsFrom = useJobsData;
}
