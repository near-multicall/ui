import { ComponentProps } from "react";

import { MI } from "../../entities";

import { ScheduleOverviewUI, ScheduleOverviewUIProps } from "./schedule-overview.ui";

export interface IScheduleOverview extends ScheduleOverviewUIProps {
    accountId: ComponentProps<typeof MI["ContextProvider"]>["daoAddress"];
}

export const ScheduleOverview = ({ accountId, ...props }: IScheduleOverview) => (
    <MI.ContextProvider daoAddress={accountId}>
        <ScheduleOverviewUI {...props} />
    </MI.ContextProvider>
);
