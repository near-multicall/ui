import { useEffect, useState } from "react";

import { Big, formatTokenAmount } from "../../../shared/lib/converter";
import { viewAccount } from "../../../shared/lib/wallet";
import { DaoContracts } from "../../types";
import { FRACTIONAL_PART_LENGTH } from "../config";

type NativeTokenData = {
    data: { dao: string; multicall: string; total: string } | null;
    loading: boolean;
};

const nativeTokenDataFx = async ({ dao, multicall }: DaoContracts, callback: (data: NativeTokenData) => void) => {
    const [daoAccInfo, multicallAccInfo] = await Promise.all([
        viewAccount(dao.address),
        viewAccount(multicall.address),
    ]);

    const daoRawBalance = daoAccInfo.amount,
        multicallRawBalance = multicallAccInfo.amount;

    return callback({
        data: {
            dao: formatTokenAmount(daoRawBalance, 24, FRACTIONAL_PART_LENGTH),
            multicall: formatTokenAmount(multicallRawBalance, 24, FRACTIONAL_PART_LENGTH),
            total: formatTokenAmount(Big(daoRawBalance).add(multicallRawBalance).toFixed(), 24, FRACTIONAL_PART_LENGTH),
        },

        loading: false,
    });
};

const useNativeTokenData = (contracts: DaoContracts) => {
    const [state, stateUpdate] = useState<NativeTokenData>({ data: null, loading: true });

    useEffect(() => void nativeTokenDataFx(contracts, stateUpdate), []);

    return state;
};

export class NativeTokenBalancesModel {
    static useData = useNativeTokenData;
}
