import clsx from "clsx";
import { ComponentProps, HTMLProps } from "react";

import { Job } from "../../../entities";

import "./jobs.scss";

interface DaoJobsTabComponentProps extends HTMLProps<HTMLDivElement>, ComponentProps<typeof Job.EntriesTable> {}

const _DaoJobsTab = "DaoJobsTab";

const DaoJobsTabComponent = ({ className, contracts }: DaoJobsTabComponentProps) => (
    <div className={clsx(_DaoJobsTab, className)}>
        <Job.EntriesTable
            className={`${_DaoJobsTab}-jobsList`}
            {...{ contracts }}
        />
    </div>
);

export const DaoJobsTab = {
    connect: (props: DaoJobsTabComponentProps) => ({
        content: <DaoJobsTabComponent {...props} />,
        lazy: true,
        name: "Jobs",
    }),
};
