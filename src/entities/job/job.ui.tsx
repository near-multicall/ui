import clsx from "clsx";
import { NavLink } from "react-router-dom";

import { Big, toTGas } from "../../shared/lib/converter";
import { DataInspector, IconLabel, Scrollable, Table, Tile } from "../../shared/ui/design";

import { JobModel } from "./job.model";
import { IJobService, JobService } from "./job.service";
import "./job.ui.scss";

const JobStatusIcons: Record<JobModel["job"]["status"], string> = {
    inactive: "🟡",
    expired: "🔴",
    active: "🟢",
    running: "🟣",
    unknown: "❔",
};

const JobDisplayStatus = ({ job }: Pick<JobModel, "job">) => {
    const statusToLabel = (status: JobModel["job"]["status"]): JobModel["job"]["status"] | string =>
        status === "running" ? `Running: ${job.run_count + 1}/${job.multicalls.length}` : status;

    return (
        <IconLabel
            icon={JobStatusIcons[job.status]}
            label={statusToLabel(job.status).charAt(0).toUpperCase() + statusToLabel(job.status).slice(1)}
        />
    );
};

export const jobAsTableRow = ({ id, job }: JobModel) => ({
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
                classes={{ label: "Job-dataInspector-label" }}
                data={job.multicalls}
                expandLevel={5}
            />

            {job.multicalls.length === 1 && (
                <NavLink
                    to="/app"
                    className="Job-action"
                    onClick={() => setTimeout(() => window.LAYOUT.fromJSON(job.multicalls[0].calls), 0)}
                >
                    Open in Editor
                </NavLink>
            )}

            <button
                className="Job-action"
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

export interface JobEntriesTableProps extends IJobService {
    className?: string;
}

export const JobEntriesTable = ({ className, ...modelInputs }: JobEntriesTableProps) => {
    const { data, error, loading } = JobService.useAllEntriesState(modelInputs),
        items = Object.values(data ?? {});

    return (
        <Tile
            classes={{ root: clsx("JobEntriesTable", className) }}
            heading="All jobs"
            noData={data !== null && items.length === 0}
            {...{ error, loading }}
        >
            <Scrollable>
                <Table
                    RowProps={{ withTitle: true }}
                    className="JobEntriesTable-body"
                    displayMode="compact"
                    header={["Status", "ID", "Start at", "Croncat hash", "Creator", "Trigger gas", "Multicalls"]}
                    rows={items.map(jobAsTableRow).reverse()}
                />
            </Scrollable>
        </Tile>
    );
};
