import { useEffect, useState } from "react";

import { Big } from "../../../shared/lib/converter";
import { FungibleToken } from "../../../shared/lib/standards/fungibleToken";
import { type FT } from "../context";

type FTInfo = {
    data: { metadata: FungibleToken["metadata"]; dao: string; multicall: string; total: string }[] | null;
    loading: boolean;
};

export class FTInfoModel {
    private static readonly nonZeroBalancesFetchFx = async (
        { dao, multicall }: FT.Inputs["contracts"],
        callback: (result: FTInfo) => void
    ) => {
        /* Get LikelyTokens list on DAO and its Multicall instance */
        const [daoLikelyTokensList, multicallLikelyTokensList] = await Promise.all([
            FungibleToken.getLikelyTokenContracts(dao.address),
            FungibleToken.getLikelyTokenContracts(multicall.address),
        ]);

        /* Merge and de-duplicate both token lists */
        const likelyTokensAddressesList = [...new Set([...daoLikelyTokensList, ...multicallLikelyTokensList])];

        const likelyTokensList = await Promise.all(
            likelyTokensAddressesList.map((address) => FungibleToken.init(address))
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

    public static readonly useNonZeroBalances = (contracts: FT.Inputs["contracts"]) => {
        const [state, stateUpdate] = useState<FTInfo>({ data: null, loading: true });

        useEffect(() => void FTInfoModel.nonZeroBalancesFetchFx(contracts, stateUpdate), [contracts, stateUpdate]);

        return state;
    };
}
