import { Account } from "@near-wallet-selector/core";
import { createContext, useEffect, useMemo, useState } from "react";

import { Multicall } from "../../../shared/lib/contracts/multicall";
import { Big } from "../../../shared/lib/converter";
import { FungibleToken } from "../../../shared/lib/standards/fungibleToken";

export interface FTModelInputs {
    balances: Pick<Account, "accountId">;
}

export class FTModel {
    public static readonly balances: {
        data:
            | null
            | (Pick<FungibleToken, "metadata"> & {
                  account: string;
                  multicallInstance: string;
                  total: string;
              })[];

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
        const miAddress = Multicall.getInstanceAddress(accountId);

        /**
         * Get LikelyTokens list on account and its Multicall Instance
         */
        const [accountLikelyTokensList, miLikelyTokensList] = await Promise.all([
            FungibleToken.getLikelyTokenContracts(accountId),
            FungibleToken.getLikelyTokenContracts(miAddress),
        ]);

        /* Merge and de-duplicate both token lists */
        const likelyTokensAddressesList = [...new Set([...accountLikelyTokensList, ...miLikelyTokensList])];

        const likelyTokensList = await Promise.all(
            likelyTokensAddressesList.map((address) => FungibleToken.init(address))
        );

        return callback({
            data: await Promise.all(
                likelyTokensList
                    .filter((token) => token.ready === true)
                    .map(async (token) => {
                        const [account, multicallInstance] = await Promise.all([
                            token.ftBalanceOf(accountId),
                            token.ftBalanceOf(miAddress),
                        ]);

                        return {
                            account,
                            metadata: token.metadata,
                            multicallInstance,
                            total: Big(multicallInstance).add(account).toFixed(),
                        };
                    })
            ),

            error: null,
            loading: false,
        });
    };

    public static readonly useBalancesState = (inputs: FTModelInputs["balances"]) => {
        const [state, stateUpdate] = useState(FTModel.balances);

        useEffect(() => void FTModel.balancesFetch(inputs, stateUpdate), [...Object.values(inputs), stateUpdate]);

        useEffect(() => {
            state.error instanceof Error && void console.error(state.error);
        }, [state.error]);

        return useMemo(() => state, [...Object.values(inputs), state]);
    };
}
