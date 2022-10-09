import { JobData } from "../../../shared/lib/contracts/multicall";
import { cronToDate } from "../../../shared/lib/converter";
import { JobConfig as Config } from "../config";

/**
 * Job status is:
 * - running: job is active, and was triggered at least once.
 * - active: job is active, but not triggered yet.
 * - Expired: job not active, and execution moment is in the past.
 * - Inactive: job not active, but execution moment in the future.
 */
const getDisplayStatus = ({ job }: JobData): string => {
    if (job.is_active) {
        if (job.run_count > -1) return `Running: ${job.run_count + 1}/${job.multicalls.length}`;
        else return Config.Status.Active;
    } else {
        if (cronToDate(job.cadence).getTime() < new Date().getTime()) return Config.Status.Expired;
        else return Config.Status.Inactive;
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
    ...job,

    job: {
        ...job.job,
        status: getDisplayStatus(job),
    },
});

export const JobExtended = {
    withStatus: jobExtendedWithStatus,
};
