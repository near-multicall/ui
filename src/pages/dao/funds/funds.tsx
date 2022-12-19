import clsx from "clsx";
import { HTMLProps } from "react";

import { Balances, BalancesProps } from "../../../widgets";

import "./funds.scss";

const _DAOFundsTab = "DAOFundsTab";

interface DAOFundsTabProps extends HTMLProps<HTMLDivElement>, BalancesProps {}

export const DAOFundsTab = {
    render: ({ className, accountId, ...props }: DAOFundsTabProps) => ({
        content: (
            <div
                className={clsx(_DAOFundsTab, className)}
                {...props}
            >
                <Balances
                    accountName="DAO"
                    {...{ accountId }}
                />
            </div>
        ),

        lazy: true,
        name: "Funds",
    }),
};
