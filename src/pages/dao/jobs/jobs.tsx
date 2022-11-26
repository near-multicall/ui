import clsx from "clsx";
import { ComponentProps, HTMLProps } from "react";

import { Job } from "../../../entities";

import "./jobs.scss";

interface DaoJobsTabUIProps extends HTMLProps<HTMLDivElement>, ComponentProps<typeof Job.EntriesTable> {}

const _DaoJobsTab = "DaoJobsTab";

const DaoJobsTabUI = ({ className, adapters, ...props }: DaoJobsTabUIProps) => (
    <div
        className={clsx(_DaoJobsTab, className)}
        {...props}
    >
        <Job.EntriesTable {...{ adapters }} />
    </div>
);

export const DaoJobsTab = {
    uiConnect: (props: DaoJobsTabUIProps) => ({
        content: <DaoJobsTabUI {...props} />,
        lazy: true,
        name: "Jobs",
    }),
};
