import { Account } from "@near-wallet-selector/core";
import { createContext, useEffect, useState } from "react";

import { Multicall } from "../../../shared/lib/contracts/multicall";
import { Big } from "../../../shared/lib/converter";
import { FungibleToken } from "../../../shared/lib/standards/fungibleToken";

export interface FTModelInputs {
    balances: Pick<Account, "accountId">;
}

export class FTModel {
    public static readonly balances: {
        data: (Pick<FungibleToken, "metadata"> & { account: string; multicall: string; total: string })[] | null;
        error: Error | null;
        loading: boolean;
    } = {
        data: null,
        error: null,
        loading: true,
    };

    public static readonly BalancesContext = createContext(FTModel.balances);

    private static readonly balancesFetch = async (
        { accountId }: FTModelInputs["balances"],
        callback: (result: typeof FTModel.balances) => void
    ) => {
        const multicallInstanceAddress = Multicall.getInstanceAddress(accountId);

        /**
         * Get LikelyTokens list on account and its Multicall Instance
         */
        const [accountLikelyTokensList, multicallLikelyTokensList] = await Promise.all([
            FungibleToken.getLikelyTokenContracts(accountId),
            FungibleToken.getLikelyTokenContracts(multicallInstanceAddress),
        ]);

        /* Merge and de-duplicate both token lists */
        const likelyTokensAddressesList = [...new Set([...accountLikelyTokensList, ...multicallLikelyTokensList])];

        const likelyTokensList = await Promise.all(
            likelyTokensAddressesList.map((address) => FungibleToken.init(address))
        );

        const rawBalances = await Promise.all(
            likelyTokensList
                .filter((token) => token.ready === true)
                .map(async (token) => {
                    const [accountRawBalance, multicallRawBalance] = await Promise.all([
                        token.ftBalanceOf(accountId),
                        token.ftBalanceOf(multicallInstanceAddress),
                    ]);

                    return {
                        account: accountRawBalance,
                        metadata: token.metadata,
                        multicall: multicallRawBalance,
                        total: Big(multicallRawBalance).add(accountRawBalance).toFixed(),
                    };
                })
        );

        return callback({
            data: rawBalances.filter(
                /** Removes tokens with 0 total balance */
                ({ total }) => Big(total).gt("0")
            ),

            error: null,
            loading: false,
        });
    };

    public static readonly useBalancesState = (inputs: FTModelInputs["balances"]) => {
        const [state, stateUpdate] = useState(FTModel.balances);

        useEffect(() => void FTModel.balancesFetch(inputs, stateUpdate), [inputs, stateUpdate]);

        return state;
    };
}
