import { ComponentProps } from "react";

import { FT, NEAR } from "../../entities";

import { FundsOverviewUI, FundsOverviewUIProps } from "./funds-overview.ui";

export interface IFundsOverview
    extends ComponentProps<typeof FT["BalancesProvider"]>,
        ComponentProps<typeof NEAR["BalancesProvider"]>,
        FundsOverviewUIProps {}

export const FundsOverview = ({ accountId, ...props }: IFundsOverview) => (
    <NEAR.BalancesProvider {...{ accountId }}>
        <FT.BalancesProvider {...{ accountId }}>
            <FundsOverviewUI {...props} />
        </FT.BalancesProvider>
    </NEAR.BalancesProvider>
);
