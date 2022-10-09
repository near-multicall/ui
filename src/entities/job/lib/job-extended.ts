import { JobData } from "../../../shared/lib/contracts/multicall";
import { cronToDate } from "../../../shared/lib/converter";
import { JobConfig as Config } from "../config";

/**
 * Checking if job is either active or running and provides a human-readable status string
 *	only if one of these conditions is satisfied.
 *
 * Job is being considered as running if it's still presented in pool,
 *	and it had been started at least once.
 *
 * @returns Either `"Active"` or `"Running"` if one of these statuses is actual, otherwise `false`.
 */
const activeOrRunning = ({ job }: JobData) =>
    job.is_active && job.run_count > -1 ? Config.Status.Running : job.is_active && Config.Status.Active;

/**
 * Checking if job is either inactive or expired and provides a human-readable status string
 *	only if one of these conditions is satisfied.
 *
 * Job is being considered as inactive if it's not presented in pool,
 *	and its execution start moment is still in the future.
 *
 * Job is being considered as inactive if it's not presented in pool,
 *	and its execution start moment is in the past.
 *
 * @returns Either `"Inactive"` or `"Expired"` if one of these statuses is actual, otherwise `false`.
 */
const inactiveOrExpired = ({ job }: JobData) =>
    (!job.is_active && cronToDate(job.cadence).getTime() > new Date().getTime() && Config.Status.Inactive) ||
    (!job.is_active && cronToDate(job.cadence).getTime() < new Date().getTime() && Config.Status.Expired);

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
        status: activeOrRunning(job) || inactiveOrExpired(job) || Config.Status.Unknown,
    },
});

export const JobExtended = {
    withStatus: jobExtendedWithStatus,
};
