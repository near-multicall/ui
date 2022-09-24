import React from "react";

import { TokenLabel } from "../../../shared/ui/components/token-label";
import { Table } from "../../../shared/ui/components/table";
import { Card } from "../../../shared/ui/components/card";
import { BalancesModel } from "../model/balances";
import { ContractsData } from "../types";
import "./fungible.scss";

interface FungibleTokenBalancesProps extends ContractsData {
    className?: string;
}

export const FungibleTokenBalances = ({ className, dao, multicall }: FungibleTokenBalancesProps) => {
    const nativeToken = BalancesModel.useNativeTokenData({ dao, multicall }),
        customTokens = BalancesModel.useCustomTokensData({ dao, multicall }),
        loading = nativeToken.loading || customTokens.loading;

    const tableContent = [
        nativeToken.data && [
            <TokenLabel native />,
            nativeToken.data.multicall,
            nativeToken.data.dao,
            nativeToken.data.total,
        ],
    ].concat(
        customTokens.data &&
            customTokens.data.map((customToken) => [
                <TokenLabel {...customToken.metadata} />,
                customToken.multicall,
                customToken.dao,
                customToken.total,
            ])
    );

    return (
        <Card {...{ className }}>
            <h1 className="title">Fungible Token Balances</h1>

            {loading ? (
                <div className="loader" />
            ) : (
                <div className="scroll-wrapper">
                    <Table
                        header={["Token", "Multicall", "DAO", "Total"]}
                        rows={tableContent}
                    />
                </div>
            )}
        </Card>
    );
};
