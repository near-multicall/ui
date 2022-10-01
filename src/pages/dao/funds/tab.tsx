import clsx from "clsx";

import { TokensBalances, type TokensBalancesProps } from "../../../widgets/tokens-balances";

import "./tab.scss";

interface DaoFundsTabComponentProps extends TokensBalancesProps {}

const _DaoFundsTab = "DaoFundsTab";

const DaoFundsTabComponent = ({ className, contracts }: DaoFundsTabComponentProps) => (
    <div className={clsx(_DaoFundsTab, className)}>
        <TokensBalances
            className={`${_DaoFundsTab}-tokenBalances`}
            {...{ contracts }}
        />
    </div>
);

export const DaoFundsTab = {
    connect: (props: DaoFundsTabComponentProps) => ({
        content: <DaoFundsTabComponent {...props} />,
        lazy: true,
        title: "Funds",
    }),
};
