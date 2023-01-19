import { Account } from "@near-wallet-selector/core";
import { createContext, useEffect, useMemo, useState } from "react";

import { Big } from "../../shared/lib/converter";
import { viewAccount } from "../../shared/lib/wallet";
import { Multicall } from "../../shared/lib/contracts/multicall";

import { NEARSchema } from "./near.model";

export interface INEARService extends Pick<Account, "accountId"> {}

export class NEARService {
    public static readonly BalancesContext = createContext(NEARSchema.balances);

    private static readonly balancesFetch = async (
        { accountId }: INEARService,
        callback: (result: typeof NEARSchema.balances) => void
    ) => {
        const [{ amount: account }, { amount: multicallInstance }] = await Promise.all([
            viewAccount(accountId),
            viewAccount(Multicall.getInstanceAddress(accountId)),
        ]);

        return callback({
            data: {
                account,
                multicallInstance,
                total: Big(account).add(multicallInstance).toFixed(),
            },

            error: null,
            loading: false,
        });
    };

    public static readonly useBalancesState = (inputs: INEARService) => {
        const [state, stateUpdate] = useState(NEARSchema.balances);

        useEffect(() => void NEARService.balancesFetch(inputs, stateUpdate), [...Object.values(inputs), stateUpdate]);

        useEffect(() => {
            state.error instanceof Error && void console.error(state.error);
        }, [state.error]);

        return useMemo(() => state, [...Object.values(inputs), ...Object.values(state)]);
    };
}
