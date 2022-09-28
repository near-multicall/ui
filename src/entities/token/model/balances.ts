import { useEffect, useState } from "react";

import { Big, formatTokenAmount } from "../../../shared/lib/converter";
import { viewAccount } from "../../../shared/lib/wallet";
import { FungibleToken } from "../../../shared/lib/standards/fungibleToken";
import { ContractsData } from "../types";

const FRAC_DIGITS = 5;
const minDisplayAmount = Big("10").pow(-FRAC_DIGITS).toFixed();

type NativeTokenData = {
    data: { dao: string; multicall: string; total: string } | null;
    loading: boolean;
};

const amountToDisplayStr = (amount: string, decimals: number): string => {
    const formattedAmount = formatTokenAmount(amount, decimals);
    if (Big(formattedAmount).gt("0") && Big(formattedAmount).lt(minDisplayAmount)) return "< " + minDisplayAmount;
    else return formatTokenAmount(amount, decimals, FRAC_DIGITS);
};

const nativeTokenDataFx = async ({ dao, multicall }: ContractsData, callback: (data: NativeTokenData) => void) => {
    const [daoAccInfo, multicallAccInfo] = await Promise.all([
        viewAccount(dao.address),
        viewAccount(multicall.address),
    ]);
    const daoRawBalance = daoAccInfo.amount,
        multicallRawBalance = multicallAccInfo.amount;

    return callback({
        data: {
            dao: formatTokenAmount(daoRawBalance, 24, FRAC_DIGITS),
            multicall: formatTokenAmount(multicallRawBalance, 24, FRAC_DIGITS),
            total: formatTokenAmount(Big(daoRawBalance).add(multicallRawBalance).toFixed(), 24, FRAC_DIGITS),
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
    // get Likely tokens list on DAO and its Multicall instance
    const [daoTknList, multicallTknList] = await Promise.all([
        FungibleToken.getLikelyTokenContracts(multicall.address),
        FungibleToken.getLikelyTokenContracts(dao.address),
    ]);
    // merge and de-duplicate both token lists
    const fullTknAddrList = [...new Set([...daoTknList, ...multicallTknList])];
    const likelyTokenList = await Promise.all(fullTknAddrList.map((address) => FungibleToken.init(address))),
        tokenList = likelyTokenList.filter((token) => token.ready === true);

    const rawBalances = await Promise.all(
        tokenList.map(async (token) => {
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
    const nonZeroBalances = rawBalances.filter((el) => Big(el.total).gt("0"));

    return callback({
        data: nonZeroBalances.map((el) => {
            const { decimals } = el.metadata;
            return {
                metadata: el.metadata,
                dao: amountToDisplayStr(el.dao, decimals),
                multicall: amountToDisplayStr(el.multicall, decimals),
                total: amountToDisplayStr(el.total, decimals),
            };
        }),
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
