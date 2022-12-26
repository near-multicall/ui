import { ComponentProps } from "react";

import { MulticallInstance } from "../../entities";

import { MulticallScheduleOverviewUI, MulticallScheduleOverviewUIProps } from "./ui/multicall-schedule-overview.ui";

export interface MulticallScheduleOverviewProps extends MulticallScheduleOverviewUIProps {
    accountId: ComponentProps<typeof MulticallInstance["ContextProvider"]>["daoAddress"];
}

export const MulticallScheduleOverview = ({ accountId, ...props }: MulticallScheduleOverviewProps) => (
    <MulticallInstance.ContextProvider daoAddress={accountId}>
        <MulticallScheduleOverviewUI {...props} />
    </MulticallInstance.ContextProvider>
);
