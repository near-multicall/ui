import clsx from "clsx";
import { HTMLProps } from "react";

import { TokensBalances, type TokensBalancesWidget } from "../../../widgets";

import "./funds.scss";

interface DaoFundsTabUIProps extends HTMLProps<HTMLDivElement>, TokensBalancesWidget.Inputs {}

const _DaoFundsTab = "DaoFundsTab";

const DaoFundsTabUI = ({ className, contracts, ...props }: DaoFundsTabUIProps) => (
    <div
        className={clsx(_DaoFundsTab, className)}
        {...props}
    >
        <TokensBalances.UI {...{ contracts }} />
    </div>
);

export const DaoFundsTab = {
    uiConnect: (props: DaoFundsTabUIProps) => ({
        content: <DaoFundsTabUI {...props} />,
        lazy: true,
        name: "Funds",
    }),
};
