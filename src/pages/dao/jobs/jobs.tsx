import clsx from "clsx";
import { HTMLProps, useContext } from "react";

import { Job, MulticallInstance } from "../../../entities";

import "./jobs.scss";

const _DAOJobsTab = "DAOJobsTab";

interface DAOJobsTabProps extends HTMLProps<HTMLDivElement> {}

const DAOJobsTabContent = ({ className, ...props }: DAOJobsTabProps) => (
    <div
        className={clsx(_DAOJobsTab, className)}
        {...props}
    >
        <Job.EntriesTable multicallInstance={useContext(MulticallInstance.Context).data} />
    </div>
);

export const DAOJobsTab = {
    render: (props: DAOJobsTabProps) => ({
        content: <DAOJobsTabContent {...props} />,
        lazy: true,
        name: "Jobs",
    }),
};
