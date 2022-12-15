import clsx from "clsx";
import { ComponentProps, HTMLProps } from "react";

import { Job } from "../../../entities";

import "./jobs.scss";

const _DaoJobsTab = "DaoJobsTab";

interface DaoJobsTabProps extends HTMLProps<HTMLDivElement>, ComponentProps<typeof Job.EntriesTable> {}

export const DaoJobsTab = {
    render: ({ className, adapters, ...props }: DaoJobsTabProps) => ({
        content: (
            <div
                className={clsx("DaoJobsTab", className)}
                {...props}
            >
                <Job.EntriesTable {...{ adapters }} />
            </div>
        ),

        lazy: true,
        name: "Jobs",
    }),
};
