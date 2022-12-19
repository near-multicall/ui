import { Account } from "@near-wallet-selector/core";
import { createContext, useEffect, useMemo, useState } from "react";

import { Big } from "../../../shared/lib/converter";
import { viewAccount } from "../../../shared/lib/wallet";
import { Multicall } from "../../../shared/lib/contracts/multicall";

export interface NEARTokenModelInputs {
    balances: Pick<Account, "accountId">;
}

export class NEARTokenModel {
    public static readonly balances: {
        data: null | {
            account: string;
            multicallInstance: string;
            total: string;
        };

        error: Error | null;
        loading: boolean;
    } = {
        data: null,
        error: null,
        loading: true,
    };

    public static readonly BalancesContext = createContext(NEARTokenModel.balances);

    private static readonly balancesFetch = async (
        { accountId }: NEARTokenModelInputs["balances"],
        callback: (result: typeof NEARTokenModel.balances) => void
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

    public static readonly useBalancesState = (inputs: NEARTokenModelInputs["balances"]) => {
        const [state, stateUpdate] = useState(NEARTokenModel.balances);

        useEffect(
            () => void NEARTokenModel.balancesFetch(inputs, stateUpdate),
            [...Object.values(inputs), stateUpdate]
        );

        useEffect(() => {
            state.error instanceof Error && void console.error(state.error);
        }, [state.error]);

        return useMemo(() => state, [...Object.values(inputs), state]);
    };
}
