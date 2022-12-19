import { ComponentProps } from "react";

import { FT, NEARToken } from "../../entities";
import { BalancesUI, BalancesUIProps } from "./ui/balances.ui";

export interface BalancesProps
    extends ComponentProps<typeof FT["BalancesProvider"]>,
        ComponentProps<typeof NEARToken["BalancesProvider"]>,
        BalancesUIProps {}

export const Balances = ({ accountId, ...props }: BalancesProps) => (
    <NEARToken.BalancesProvider {...{ accountId }}>
        <FT.BalancesProvider {...{ accountId }}>
            <BalancesUI {...props} />
        </FT.BalancesProvider>
    </NEARToken.BalancesProvider>
);
