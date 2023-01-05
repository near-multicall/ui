import { ComponentProps } from "react";

import { MulticallInstance } from "../../entities";

import { ScheduleOverviewUI, ScheduleOverviewUIProps } from "./ui/schedule-overview.ui";

export interface ScheduleOverviewProps extends ScheduleOverviewUIProps {
    accountId: ComponentProps<typeof MulticallInstance["ContextProvider"]>["daoAddress"];
}

export const ScheduleOverview = ({ accountId, ...props }: ScheduleOverviewProps) => (
    <MulticallInstance.ContextProvider daoAddress={accountId}>
        <ScheduleOverviewUI {...props} />
    </MulticallInstance.ContextProvider>
);
