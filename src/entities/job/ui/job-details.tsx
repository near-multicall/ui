import { NavLink } from "react-router-dom";

import { cronToDate, toTGas } from "../../../shared/lib/converter";
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
    cronToDate(job.cadence).toLocaleString(),
    job.croncat_hash.length === 0 ? <i>none</i> : job.croncat_hash,
    job.creator,
    `${toTGas(job.trigger_gas)} Tgas`,

    <>
        <DataInspector
            classes={{ label: `${_Job}-dataInspector-label` }}
            data={job.multicalls}
            expandLevel={5}
        />

        {job.multicalls.length > 0 && (
            <NavLink
                to="/app"
                className={`${_Job}-action`}
                onClick={() => setTimeout(() => window.LAYOUT.fromJSON(job.multicalls[0].calls), 0)}
            >
                View in Editor
            </NavLink>
        )}
    </>,
];
