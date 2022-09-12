import { useEffect, useState } from "react";

import { Big } from "../../../utils/converter";
import { viewAccount } from "../../../utils/wallet";
import { FungibleToken } from "../../../utils/standards/fungibleToken";
import { ContractsData } from "../types";

type NativeTokenData = {
    data: { dao: string; multicall: string } | null;
    loading: boolean;
};

const nativeTokenDataFx = async ({ dao, multicall }: ContractsData, callback: (data: NativeTokenData) => void) =>
    callback({
        data: {
            dao: (await viewAccount(dao.address)).amount,
            multicall: (await viewAccount(multicall.address)).amount,
        },

        loading: false,
    });

const useNativeTokenData = (args: ContractsData) => {
    const [state, stateUpdate] = useState<NativeTokenData>({ data: null, loading: true });

    useEffect(() => void nativeTokenDataFx(args, stateUpdate), []);

    return state;
};

type CustomTokensData = {
    data: { dao: string; multicall: string; token: FungibleToken; total: string }[] | null;
    loading: boolean;
};

const customTokensDataFx = async ({ dao, multicall }: ContractsData, callback: (data: CustomTokensData) => void) => {
    const tokenAddrList = await FungibleToken.getLikelyTokenContracts(multicall.address);
    const likelyTokenList = await Promise.all(tokenAddrList.map((address) => FungibleToken.init(address)));
    const tokenList = likelyTokenList.filter((token) => token.ready === true);

    const balances = await Promise.all(
        tokenList.map(async (token) => {
            const [multicallBalance, daoBalance] = await Promise.all([
                token.ftBalanceOf(multicall.address),
                token.ftBalanceOf(dao.address),
            ]);

            return {
                dao: daoBalance,
                multicall: multicallBalance,
                token,
                total: Big(multicallBalance).add(daoBalance).toFixed(),
            };
        })
    );

    return callback({
        data: balances.filter((el) => Big(el.total).gt("0")),
        loading: false,
    });
};

const useCustomTokensData = (args: ContractsData) => {
    const [state, stateUpdate] = useState<CustomTokensData>({ data: null, loading: true });

    useEffect(() => void customTokensDataFx(args, stateUpdate), []);

    return state;
};

export const BalancesModel = {
    useCustomTokensData,
    useNativeTokenData,
};
