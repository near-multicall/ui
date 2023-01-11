import { Icon } from "@mui/material";
import { NavLink } from "react-router-dom";

import { Big, toTGas } from "../../../shared/lib/converter";
import { DataInspector, IconLabel } from "../../../shared/ui/design";
import { ModuleContext, Job } from "../context";

import "./job.scss";

const _Job = "Job";

const JobDisplayStatus = ({ job }: Pick<Job.DataWithStatus, "job">) => {
    const statusTextByStatus = {
        ...ModuleContext.Status,
        [ModuleContext.Status.Running]: `${ModuleContext.Status.Running}: ${job.run_count + 1}/${
            job.multicalls.length
        }`,
    };

    return (
        <IconLabel
            icon={ModuleContext.StatusIcons[job.status]}
            label={statusTextByStatus[job.status]}
        />
    );
};

export const jobAsTableRow = ({ id, job }: Job.DataWithStatus) => ({
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

            <button
                className={`${_Job}-action`}
                onClick={(e: React.MouseEvent) => {
                    navigator.clipboard.writeText(JSON.stringify(job.multicalls, null, 2));
                    const target = e.target as HTMLElement;
                    if (target.innerHTML === "Copied!") return;

                    const oldIcon = target.innerHTML;
                    target.innerHTML = "Copied!";

                    setTimeout(() => {
                        target.innerHTML = oldIcon;
                    }, 1000);
                }}
            >
                Copy
            </button>
        </>,
    ],

    id: id.toString(),
});
