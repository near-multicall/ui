import { NavLink } from "react-router-dom";

import { Big, toTGas } from "../../../shared/lib/converter";
import { DataInspector, IconLabel } from "../../../shared/ui/design";
import { JobDataWithStatus, JobStatus } from "../model/job.model";

import "./job.entry.scss";

const _Job = "Job";

const JobStatusIcons = {
    [JobStatus.Inactive]: "🟡",
    [JobStatus.Expired]: "🔴",
    [JobStatus.Active]: "🟢",
    [JobStatus.Running]: "🟣",
    [JobStatus.Unknown]: "❔",
};

const JobDisplayStatus = ({ job }: Pick<JobDataWithStatus, "job">) => {
    const statusTextByStatus = {
        ...JobStatus,
        [JobStatus.Running]: `${JobStatus.Running}: ${job.run_count + 1}/${job.multicalls.length}`,
    };

    return (
        <IconLabel
            icon={JobStatusIcons[job.status]}
            label={statusTextByStatus[job.status]}
        />
    );
};

export const jobAsTableRow = ({ id, job }: JobDataWithStatus) => ({
    content: [
        <JobDisplayStatus {...{ job }} />,
        id,
        /** Multicall returns timestamp in nanoseconds, JS Date uses milliseconds */
        new Date(parseInt(Big(job.start_at).div("1000000").toFixed())).toLocaleString(),
        job.croncat_hash.length === 0 ? <i>none</i> : job.croncat_hash,
        job.creator,
        `${toTGas(job.trigger_gas)} Tgas`,

        <>
            <DataInspector
                classes={{ label: `${_Job}-dataInspector-label` }}
                data={job.multicalls}
                expandLevel={5}
            />

            {job.multicalls.length === 1 && (
                <NavLink
                    to="/app"
                    className={`${_Job}-action`}
                    onClick={() => setTimeout(() => window.LAYOUT.fromJSON(job.multicalls[0].calls), 0)}
                >
                    Open in Editor
                </NavLink>
            )}
        </>,
    ],

    id: id.toString(),
});