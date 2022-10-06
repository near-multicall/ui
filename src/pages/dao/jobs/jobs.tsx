import clsx from "clsx";

import { Job, type JobDependencies } from "../../../entities";

import "./jobs.scss";

interface DaoJobsTabComponentProps extends JobDependencies {}

const _DaoJobsTab = "DaoJobsTab";

const DaoJobsTabComponent = ({ className, contracts }: DaoJobsTabComponentProps) => (
    <div className={clsx(_DaoJobsTab, className)}>
        <Job.ListOfAll
            className={`${_DaoJobsTab}-jobsList`}
            {...{ contracts }}
        />
    </div>
);

export const DaoJobsTab = {
    connect: (props: DaoJobsTabComponentProps) => ({
        content: <DaoJobsTabComponent {...props} />,
        lazy: true,
        title: "Jobs",
    }),
};
