import clsx from "clsx";
import { HTMLProps, useContext } from "react";

import { Job, MulticallInstance } from "../../../entities";

import "./jobs.scss";

const _DaoJobsTab = "DaoJobsTab";

interface DaoJobsTabProps extends HTMLProps<HTMLDivElement> {}

const DAOJobsTabContent = ({ className, ...props }: DaoJobsTabProps) => (
    <div
        className={clsx("DaoJobsTab", className)}
        {...props}
    >
        <Job.EntriesTable multicallInstance={useContext(MulticallInstance.Context).data} />
    </div>
);

export const DaoJobsTab = {
    render: (props: DaoJobsTabProps) => ({
        content: <DAOJobsTabContent {...props} />,
        lazy: true,
        name: "Jobs",
    }),
};
