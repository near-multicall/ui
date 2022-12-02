import { Base64 } from "js-base64";

import { Big } from "../../../shared/lib/converter";
import { ModuleContext, Job } from "../module-context";

/**
 * Job status is:
 * - running: job is active, and was triggered at least once.
 * - active: job is active, but not triggered yet.
 * - Expired: job not active, and execution moment is in the past.
 * - Inactive: job not active, but execution moment in the future.
 */
const jobToStatus = ({ job }: Job.Data): Job.Status => {
    if (job.is_active) {
        if (job.run_count > -1) return ModuleContext.Status.Running;
        else return ModuleContext.Status.Active;
    } else {
        // Date.now() returns timestamp in milliseconds, we use nanoseconds
        const currentTime = Big(Date.now()).times("1000000");
        const jobTime = job.start_at;
        if (currentTime.gt(jobTime)) return ModuleContext.Status.Expired;
        else return ModuleContext.Status.Inactive;
    }
};

/**
 * Decodes base64-encoded arguments of for every multicall's FunctionCall
 *	and returns a new data structure with encoded version replaced with decoded one.
 *
 * @returns Updated job data structure.
 */
const jobToJobWithMulticallsDataDecoded = ({ id, job }: Job.Data): Job.Data => ({
    id,

    job: {
        ...job,

        multicalls: job.multicalls.map((multicall) => ({
            ...multicall,

            calls: multicall.calls.map((batchCalls) =>
                batchCalls.map((batchCall) => ({
                    ...batchCall,

                    actions: batchCall.actions.map((action) => ({
                        ...action,

                        args: JSON.parse(Base64.decode(action.args)),
                    })),
                }))
            ),
        })),
    },
});

/**
 * Calculates the actual job status from the given data
 *	and adds it as an additional property to the new data structure.
 *
 * If a calculation error has ocurred, the `"Unknown"` status is being presented.
 *
 * @returns Extended job data structure.
 */
const jobToJobWithStatus = (job: Job.Data): Job.DataWithStatus => ({
    ...job,
    job: { ...job.job, status: ModuleContext.Status[jobToStatus(job)] },
});

export const JobNormalized = {
    withMulticallsDataDecoded: jobToJobWithMulticallsDataDecoded,
    withStatus: jobToJobWithStatus,
};
