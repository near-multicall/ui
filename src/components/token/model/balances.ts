import { useEffect, useState } from "react";

import { Big, formatTokenAmount } from "../../../utils/converter";
import { viewAccount } from "../../../utils/wallet";
import { FungibleToken } from "../../../utils/standards/fungibleToken";
import { ContractsData } from "../types";

type NativeTokenData = {
    data: { dao: string; multicall: string; total: string } | null;
    loading: boolean;
};

const nativeTokenDataFx = async ({ dao, multicall }: ContractsData, callback: (data: NativeTokenData) => void) => {
    const daoRawBalance = (await viewAccount(dao.address)).amount,
        multicallRawBalance = (await viewAccount(multicall.address)).amount;

    return callback({
        data: {
            dao: formatTokenAmount(daoRawBalance, 24, 2),
            multicall: formatTokenAmount(multicallRawBalance, 24, 2),
            total: formatTokenAmount(Big(daoRawBalance).add(multicallRawBalance).toFixed(), 24, 2),
        },

        loading: false,
    });
};

const useNativeTokenData = (args: ContractsData) => {
    const [state, stateUpdate] = useState<NativeTokenData>({ data: null, loading: true });

    useEffect(() => void nativeTokenDataFx(args, stateUpdate), []);

    return state;
};

type CustomTokensData = {
    data: { metadata: FungibleToken["metadata"]; dao: string; multicall: string; total: string }[] | null;
    loading: boolean;
};

const customTokensDataFx = async ({ dao, multicall }: ContractsData, callback: (data: CustomTokensData) => void) => {
    const tokenAddrList = await FungibleToken.getLikelyTokenContracts(multicall.address),
        likelyTokenList = await Promise.all(tokenAddrList.map((address) => FungibleToken.init(address))),
        tokenList = likelyTokenList.filter((token) => token.ready === true);

    const balances = await Promise.all(
        tokenList.map(async (token) => {
            const rawBalances = await Promise.all([
                token.ftBalanceOf(dao.address),
                token.ftBalanceOf(multicall.address),
            ]).then(([daoRawBalance, multicallRawBalance]) => ({
                dao: daoRawBalance,
                multicall: multicallRawBalance,
                total: Big(multicallRawBalance).add(daoRawBalance).toFixed(),
            }));

            return {
                metadata: token.metadata,
                dao: formatTokenAmount(rawBalances.dao, token.metadata.decimals, 2),
                multicall: formatTokenAmount(rawBalances.multicall, token.metadata.decimals, 2),
                total: formatTokenAmount(rawBalances.total, token.metadata.decimals, 2),
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
