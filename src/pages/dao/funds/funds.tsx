import clsx from "clsx";
import { HTMLProps } from "react";

import { TokenBalances, type TokenBalancesProps } from "../../../widgets";

import "./funds.scss";

const _DaoFundsTab = "DaoFundsTab";

interface DaoFundsTabProps extends HTMLProps<HTMLDivElement>, TokenBalancesProps {}

const Content = ({ className, adapters, ...props }: DaoFundsTabProps) => (
    <div
        className={clsx(_DaoFundsTab, className)}
        {...props}
    >
        <TokenBalances {...{ adapters }} />
    </div>
);

Content.displayName = _DaoFundsTab;

export const DaoFundsTab = {
    render: (props: DaoFundsTabProps) => ({
        content: <Content {...props} />,
        lazy: true,
        name: "Funds",
    }),
};
