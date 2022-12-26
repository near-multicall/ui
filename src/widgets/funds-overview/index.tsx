import { ComponentProps } from "react";

import { FT, NEARToken } from "../../entities";

import { FundsOverviewUI, FundsOverviewUIProps } from "./ui/funds-overview.ui";

export interface FundsOverviewProps
    extends ComponentProps<typeof FT["BalancesProvider"]>,
        ComponentProps<typeof NEARToken["BalancesProvider"]>,
        FundsOverviewUIProps {}

export const FundsOverview = ({ accountId, ...props }: FundsOverviewProps) => (
    <NEARToken.BalancesProvider {...{ accountId }}>
        <FT.BalancesProvider {...{ accountId }}>
            <FundsOverviewUI {...props} />
        </FT.BalancesProvider>
    </NEARToken.BalancesProvider>
);
