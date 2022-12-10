import clsx from "clsx";
import { ComponentProps, HTMLProps } from "react";

import { Job } from "../../../entities";

import "./jobs.scss";

const _DaoJobsTab = "DaoJobsTab";

interface DaoJobsTabProps extends HTMLProps<HTMLDivElement>, ComponentProps<typeof Job.EntriesTable> {}

const Content = ({ className, adapters, ...props }: DaoJobsTabProps) => (
    <div
        className={clsx(_DaoJobsTab, className)}
        {...props}
    >
        <Job.EntriesTable {...{ adapters }} />
    </div>
);

Content.displayName = _DaoJobsTab;

export const DaoJobsTab = {
    render: (props: DaoJobsTabProps) => ({
        content: <Content {...props} />,
        lazy: true,
        name: "Jobs",
    }),
};
