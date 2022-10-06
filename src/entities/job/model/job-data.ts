import { useEffect, useState } from "react";
import { JobData } from "../../../shared/lib/contracts/multicall";

import { Dependencies } from "../config";

type JobsDataFxResponse = {
    data: Record<JobData["id"], JobData> | null;
    error?: Error | null;
    loading: boolean;
};

const jobsDataFx = async ({ multicall }: Dependencies["contracts"], callback: (result: JobsDataFxResponse) => void) =>
    callback(
        await multicall
            .getJobs()
            .then((data) => ({
                data: data.reduce((jobsRegistry, { id, job }) => ({ ...jobsRegistry, [id]: { id, job } }), {}),
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
