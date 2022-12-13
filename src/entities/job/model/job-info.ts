import { useEffect, useState } from "react";

import { Entity } from "../module-context";
import { JobNormalized } from "../lib/job-normalized";

type Jobs = {
    /** Jobs indexed by ID for easy access to each particular job */
    data: Record<Entity.DataWithStatus["id"], Entity.DataWithStatus> | null;
    error?: Error | null;
    loading: boolean;
};

export class JobInfoModel {
    static allEntriesFetch = async (
        { multicallInstance }: Entity.Inputs["adapters"],
        callback: (result: Jobs) => void
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

    static useAllEntries = (adapters: Entity.Inputs["adapters"]) => {
        const [state, stateUpdate] = useState<Jobs>({ data: null, error: null, loading: true });

        useEffect(() => void JobInfoModel.allEntriesFetch(adapters, stateUpdate), [adapters, stateUpdate]);

        useEffect(() => {
            state.error instanceof Error && void console.error(state.error);
        }, [state]);

        return state;
    };
}
