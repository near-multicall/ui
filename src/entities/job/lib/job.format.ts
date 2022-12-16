import { Base64 } from "js-base64";

import { JobData } from "../../../shared/lib/contracts/multicall";
import { Big } from "../../../shared/lib/converter";
import { JobDataWithStatus, JobStatus } from "../model/job.model";

/**
 * Job status is:
 * - running: job is active, and was triggered at least once.
 * - active: job is active, but not triggered yet.
 * - Expired: job not active, and execution moment is in the past.
 * - Inactive: job not active, but execution moment in the future.
 */
const jobToStatus = ({ job }: JobData): JobStatus => {
    if (job.is_active) {
        if (job.run_count > -1) return JobStatus.Running;
        else return JobStatus.Active;
    } else {
        // Date.now() returns timestamp in milliseconds, we use nanoseconds
        const currentTime = Big(Date.now()).times("1000000");
        const jobTime = job.start_at;
        if (currentTime.gt(jobTime)) return JobStatus.Expired;
        else return JobStatus.Inactive;
    }
};

/**
 * Decodes base64-encoded arguments of for every multicall's FunctionCall
 *	and returns a new data structure with encoded version replaced with decoded one.
 *
 * @returns Updated job data structure.
 */
const withMulticallsDataDecoded = ({ id, job }: JobData): JobData => ({
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
const withStatus = (job: JobData): JobDataWithStatus => ({
    ...job,
    job: { ...job.job, status: JobStatus[jobToStatus(job)] },
});

export const JobFormat = {
    withMulticallsDataDecoded,
    withStatus,
};
