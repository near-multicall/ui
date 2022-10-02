import { useEffect, useState } from "react";

import { Big } from "../../../shared/lib/converter";
import { FungibleToken } from "../../../shared/lib/standards/fungibleToken";
import { DaoContracts } from "../../types";

type FungibleTokensData = {
    data: { metadata: FungibleToken["metadata"]; dao: string; multicall: string; total: string }[] | null;
    loading: boolean;
};

const fungibleTokensDataFx = async ({ dao, multicall }: DaoContracts, callback: (data: FungibleTokensData) => void) => {
    /* Get LikelyTokens list on DAO and its Multicall instance */
    const [daoLikelyTokensList, multicallLikelyTokensList] = await Promise.all([
        FungibleToken.getLikelyTokenContracts(multicall.address),
        FungibleToken.getLikelyTokenContracts(dao.address),
    ]);

    /* Merge and de-duplicate both token lists */
    const fullLikelyTokensAddressesList = [...new Set([...daoLikelyTokensList, ...multicallLikelyTokensList])];

    const likelyTokensList = await Promise.all(
        fullLikelyTokensAddressesList.map((address) => FungibleToken.init(address))
    );

    const rawBalances = await Promise.all(
        likelyTokensList
            .filter((token) => token.ready === true)
            .map(async (token) => {
                const [daoRawBalance, multicallRawBalance] = await Promise.all([
                    token.ftBalanceOf(dao.address),
                    token.ftBalanceOf(multicall.address),
                ]);

                return {
                    metadata: token.metadata,
                    dao: daoRawBalance,
                    multicall: multicallRawBalance,
                    total: Big(multicallRawBalance).add(daoRawBalance).toFixed(),
                };
            })
    );

    // remove tokens with 0 total balance
    const nonZeroBalances = rawBalances.filter(({ total }) => Big(total).gt("0"));

    return callback({
        data: nonZeroBalances.map(({ dao, metadata, multicall, total }) => ({ metadata, dao, multicall, total })),
        loading: false,
    });
};

const useFungibleTokensData = (daoContracts: DaoContracts) => {
    const [state, stateUpdate] = useState<FungibleTokensData>({ data: null, loading: true });

    useEffect(() => void fungibleTokensDataFx(daoContracts, stateUpdate), []);

    return state;
};

export class FungibleTokenBalancesModel {
    static useAllData = useFungibleTokensData;
}
