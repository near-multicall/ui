import { NavLink } from "react-router-dom";

import { cronToDate, toTGas } from "../../../shared/lib/converter";
import { DataInspector } from "../../../shared/ui/components";

import { JobConfig, type JobEntity } from "../config";

interface JobDetailsTableRowRenderProps extends JobEntity.DataWithStatus {}

const _Job = "_Job";

const JobDisplayStatus = ({ job }: Pick<JobEntity.DataWithStatus, "job">) => {
    const statusTextByStatus = {
        ...JobConfig.Status,
        [JobConfig.Status.Running]: `${JobConfig.Status.Running}: ${job.run_count + 1}/${job.multicalls.length}`,
    };

    return (
        <span>
            <span>{JobConfig.StatusIcons[job.status]}</span>
            <span> {statusTextByStatus[job.status]}</span>
        </span>
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
