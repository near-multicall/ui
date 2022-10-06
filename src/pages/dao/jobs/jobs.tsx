import clsx from "clsx";
import { useMemo, useState } from "react";

import { Job, type JobDependencies } from "../../../entities";

import "./jobs.scss";

interface DaoJobsTabComponentProps extends JobDependencies {}

const _DaoJobsTab = "DaoJobsTab";

const DaoJobsTabComponent = ({ className, contracts }: DaoJobsTabComponentProps) => {
    const [selectedJobId, selectedJobIdSwitch] = useState<number | null>(null);

    const jobSelect = useMemo((id: number) => () => selectedJobIdSwitch(id), [selectedJobIdSwitch]);

    return (
        <div className={clsx(_DaoJobsTab, className)}>
            <Job.ListOfAll
                className={`${_DaoJobsTab}-jobsList`}
                elementClickHandler={jobSelect}
                {...{ contracts }}
            />

            <Job.Details
                className={`${_DaoJobsTab}-jobDetails`}
                id={selectedJobId}
            />
        </div>
    );
};

export const DaoJobsTab = {
    connect: (props: DaoJobsTabComponentProps) => ({
        content: <DaoJobsTabComponent {...props} />,
        lazy: true,
        title: "Jobs",
    }),
};
