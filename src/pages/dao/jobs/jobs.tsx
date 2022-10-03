import { AddOutlined, DeleteOutline, EditOutlined, PauseOutlined, PlayArrowOutlined } from "@mui/icons-material";
import clsx from "clsx";
import type { HTMLProps } from "react";

import { JobSchema } from "../../../shared/lib/contracts/multicall";
import { Facet, Scrollable } from "../../../shared/ui/components";

import "./jobs.scss";

const Job = ({ data: { croncat_hash, is_active, ...data } }: { data: JobSchema }) => (
    <div
        className="JobsList-item"
        key={croncat_hash}
    >
        <EditOutlined />
        <DeleteOutline />
        {is_active ? <PauseOutlined /> : <PlayArrowOutlined />}
        <pre>{JSON.stringify(data, null, "  ")}</pre>
    </div>
);

interface DaoJobsTabComponentProps extends HTMLProps<HTMLDivElement> {
    jobs: JobSchema[];
}

const _DaoJobsTab = "DaoJobsTab";

const DaoJobsTabComponent = ({ className, jobs }: DaoJobsTabComponentProps) => (
    <div className={clsx(_DaoJobsTab, className)}>
        <Facet className="JobsList">
            <AddOutlined />
            <h1 className="title">Jobs</h1>
            <Scrollable>
                {jobs.map((data) => (
                    <Job
                        key={data.croncat_hash}
                        {...{ data }}
                    />
                ))}
            </Scrollable>
        </Facet>
    </div>
);

export const DaoJobsTab = {
    connect: (props: DaoJobsTabComponentProps) => ({
        content: <DaoJobsTabComponent {...props} />,
        lazy: true,
        title: "Jobs",
    }),
};
