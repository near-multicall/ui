import clsx from "clsx";
import { HTMLProps } from "react";

import { TokenBalances, type TokenBalancesModule } from "../../../widgets";

import "./funds.scss";

interface DaoFundsTabUIProps extends HTMLProps<HTMLDivElement>, TokenBalancesModule.Inputs {}

const _DaoFundsTab = "DaoFundsTab";

const DaoFundsTabUI = ({ className, contracts, ...props }: DaoFundsTabUIProps) => (
    <div
        className={clsx(_DaoFundsTab, className)}
        {...props}
    >
        <TokenBalances.UI {...{ contracts }} />
    </div>
);

export const DaoFundsTab = {
    uiConnect: (props: DaoFundsTabUIProps) => ({
        content: <DaoFundsTabUI {...props} />,
        lazy: true,
        name: "Funds",
    }),
};
