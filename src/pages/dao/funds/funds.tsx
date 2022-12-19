import clsx from "clsx";
import { ComponentProps, HTMLProps } from "react";

import { FT, NEARToken } from "../../../entities";
import { Balances } from "../../../widgets";

import "./funds.scss";

const _DAOFundsTab = "DAOFundsTab";

interface DAOFundsTabProps
    extends HTMLProps<HTMLDivElement>,
        ComponentProps<typeof FT["BalancesProvider"]>,
        ComponentProps<typeof NEARToken["BalancesProvider"]> {
    className?: string;
}

const DAOFundsTabContent = ({ className, accountId, ...props }: DAOFundsTabProps) => (
    <NEARToken.BalancesProvider {...{ accountId }}>
        <FT.BalancesProvider {...{ accountId }}>
            <div
                className={clsx(_DAOFundsTab, className)}
                {...props}
            >
                <Balances accountName="DAO" />
            </div>
        </FT.BalancesProvider>
    </NEARToken.BalancesProvider>
);

export const DAOFundsTab = {
    render: (props: DAOFundsTabProps) => ({
        content: <DAOFundsTabContent {...props} />,
        lazy: true,
        name: "Funds",
    }),
};
