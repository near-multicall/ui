import { useEffect, useMemo, useState } from "react";

import { Multicall } from "../../shared/lib/contracts/multicall";

import { JobLib } from "./job.lib";
import { JobsSchema } from "./job.model";

export interface IJobService {
    multicallInstance: Multicall;
}

export class JobService {
    private static readonly allEntriesFetch = async (
        { multicallInstance }: IJobService,
        callback: (result: typeof JobsSchema) => void
    ) =>
        void (
            multicallInstance.ready &&
            callback(
                await multicallInstance
                    .getJobs()
                    .then((data) => ({
                        data: data.reduce((jobs, job) => ({ ...jobs, [job.id]: JobLib.toDecoded(job) }), {}),
                        error: null,
                        loading: false,
                    }))
                    .catch((error) => ({ data: null, error, loading: false }))
            )
        );

    public static readonly useAllEntriesState = (inputs: IJobService) => {
        const [state, stateUpdate] = useState(JobsSchema);

        useEffect(() => {
            stateUpdate(JobsSchema);
            void JobService.allEntriesFetch(inputs, stateUpdate);
        }, [...Object.values(inputs), stateUpdate]);

        useEffect(() => {
            state.error instanceof Error && void console.error(state.error);
        }, [state.error]);

        return useMemo(() => state, [...Object.values(inputs), state]);
    };
}
