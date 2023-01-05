import clsx from "clsx";
import { HTMLProps, useContext } from "react";

import { Job, MulticallInstance } from "../../../entities";

import "./schedule-overview.ui.scss";

const _ScheduleOverview = "ScheduleOverview";

export interface ScheduleOverviewUIProps extends HTMLProps<HTMLDivElement> {}

export const ScheduleOverviewUI = ({ className, ...props }: ScheduleOverviewUIProps) => {
    const multicallInstance = useContext(MulticallInstance.Context);

    return (
        <div
            className={clsx(_ScheduleOverview, className)}
            {...props}
        >
            <Job.EntriesTable multicallInstance={multicallInstance.data} />
        </div>
    );
};
