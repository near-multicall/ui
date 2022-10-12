import { NavLink } from "react-router-dom";

import { Big, toTGas } from "../../../shared/lib/converter";
import { DataInspector, IconLabel } from "../../../shared/ui/components";

import { JobConfig, type JobEntity } from "../config";
import "./job-details.scss";

interface JobDetailsTableRowRenderProps extends JobEntity.DataWithStatus {}

const _Job = "Job";

const JobDisplayStatus = ({ job }: Pick<JobEntity.DataWithStatus, "job">) => {
    const statusTextByStatus = {
        ...JobConfig.Status,
        [JobConfig.Status.Running]: `${JobConfig.Status.Running}: ${job.run_count + 1}/${job.multicalls.length}`,
    };

    return (
        <IconLabel
            icon={JobConfig.StatusIcons[job.status]}
            label={statusTextByStatus[job.status]}
        />
    );
};

export const jobDetailsTableRowRender = ({ id, job }: JobDetailsTableRowRenderProps) => [
    <JobDisplayStatus {...{ job }} />,
    id,
    // Multicall returns timestamp in nanoseconds, JS Date uses milliseconds
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
];
