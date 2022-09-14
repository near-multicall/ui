import React from "react";

import { TokenLabel } from "../../../shared/ui/components/token-label/token-label";
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
            ? [<TokenLabel native />, nativeToken.data.multicall, nativeToken.data.dao, nativeToken.data.total]
            : [],

        ...(!customTokens.loading && customTokens.data
            ? customTokens.data.map((customToken) => [
                  <TokenLabel {...customToken.metadata} />,
                  customToken.multicall,
                  customToken.dao,
                  customToken.total,
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
