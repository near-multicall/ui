import clsx from "clsx";

import { TokensBalances, type TokensBalancesDependencies } from "../../../widgets";

import "./funds.scss";

interface DaoFundsTabComponentProps extends TokensBalancesDependencies {}

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
