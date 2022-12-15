import clsx from "clsx";
import { HTMLProps } from "react";

import { Balances, BalancesProps } from "../../../widgets";

import "./funds.scss";

const _DaoFundsTab = "DaoFundsTab";

interface DaoFundsTabProps extends HTMLProps<HTMLDivElement>, Omit<BalancesProps, "accountName"> {}

export const DaoFundsTab = {
    render: ({ className, accountId, ...props }: DaoFundsTabProps) => ({
        content: (
            <div
                className={clsx(_DaoFundsTab, className)}
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
