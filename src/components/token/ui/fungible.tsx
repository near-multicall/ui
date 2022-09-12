import React from "react";

import { TokenLabel } from "../../../shared/ui/components/token-label/token-label";
import { Big, formatTokenAmount } from "../../../utils/converter";
import { Table } from "../../../shared/ui/components/table";
import { ContractsData } from "../types";
import { BalancesModel } from "../model/balances";

interface Props extends ContractsData {
    className?: string;
}

export const FungibleTokenBalances = ({ className, dao, multicall }: Props) => {
    const nativeToken = BalancesModel.useNativeTokenData({ dao, multicall });
    const customTokens = BalancesModel.useCustomTokensData({ dao, multicall });

    const tableContent = [
        !nativeToken.loading && nativeToken.data
            ? [
                  <TokenLabel native />,
                  formatTokenAmount(nativeToken.data.multicall, 24, 2),
                  formatTokenAmount(nativeToken.data.dao, 24, 2),
                  formatTokenAmount(Big(nativeToken.data.dao).add(nativeToken.data.multicall).toFixed(), 24, 2),
              ]
            : [],

        ...(!customTokens.loading && customTokens.data
            ? customTokens.data.map(({ token: { metadata }, ...customToken }) => [
                  <TokenLabel {...metadata} />,
                  formatTokenAmount(customToken.multicall, metadata.decimals, 2),
                  formatTokenAmount(customToken.dao, metadata.decimals, 2),
                  formatTokenAmount(customToken.total, metadata.decimals, 2),
              ])
            : []),
    ];

    return (
        <div {...{ className }}>
            <h1 className="title">Fungible Token Balances</h1>

            <Table
                header={["Token", "Multicall", "DAO", "Total"]}
                rows={tableContent.length > 0 ? tableContent : [["...", "...", "...", "..."]]}
            />
        </div>
    );
};
