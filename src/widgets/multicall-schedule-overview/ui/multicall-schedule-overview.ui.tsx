import clsx from "clsx";
import { HTMLProps, useContext } from "react";

import { Job, MulticallInstance } from "../../../entities";

import "./multicall-schedule-overview.ui.scss";

const _MulticallScheduleOverview = "MulticallScheduleOverview";

export interface MulticallScheduleOverviewUIProps extends HTMLProps<HTMLDivElement> {}

export const MulticallScheduleOverviewUI = ({ className, ...props }: MulticallScheduleOverviewUIProps) => {
    const multicallInstance = useContext(MulticallInstance.Context);

    return (
        <div
            className={clsx(_MulticallScheduleOverview, className)}
            {...props}
        >
            <Job.EntriesTable multicallInstance={multicallInstance.data} />
        </div>
    );
};
