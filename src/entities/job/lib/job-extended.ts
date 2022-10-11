import { JobData } from "../../../shared/lib/contracts/multicall";
import { cronToDate } from "../../../shared/lib/converter";

import { JobConfig } from "../config";

/**
 * Job status is:
 * - running: job is active, and was triggered at least once.
 * - active: job is active, but not triggered yet.
 * - Expired: job not active, and execution moment is in the past.
 * - Inactive: job not active, but execution moment in the future.
 */
const jobToStatus = ({ job }: JobData): string => {
    if (job.is_active) {
        if (job.run_count > -1) return JobConfig.Status.Running;
        else return JobConfig.Status.Active;
    } else {
        if (cronToDate(job.cadence).getTime() < new Date().getTime()) return JobConfig.Status.Expired;
        else return JobConfig.Status.Inactive;
    }
};

/**
 * Calculates the actual job status from the given data
 *	and adds it as an additional property to the new data structure.
 *
 * If a calculation error has ocurred, the `"Unknown"` status is being presented.
 *
 * @returns Extended job data structure.
 */
const jobExtendedWithStatus = (job: JobData) => ({
    id: job.id,
    job: {
        ...job.job,
        status: jobToStatus(job),
    },
});

export const JobExtended = {
    withStatus: jobExtendedWithStatus,
};
