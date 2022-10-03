import { useEffect, useState } from "react";

import { Big, formatTokenAmount } from "../../../shared/lib/converter";
import { viewAccount } from "../../../shared/lib/wallet";
import { DaoContracts } from "../../types";
import { FRACTIONAL_PART_LENGTH } from "../config";

type NearTokenData = {
    data: { dao: string; multicall: string; total: string } | null;
    loading: boolean;
};

const nearTokenDataFx = async ({ dao, multicall }: DaoContracts, callback: (data: NearTokenData) => void) => {
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

const useNearTokenData = (daoContracts: DaoContracts) => {
    const [state, stateUpdate] = useState<NearTokenData>({ data: null, loading: true });

    useEffect(() => void nearTokenDataFx(daoContracts, stateUpdate), []);

    return state;
};

export class NearTokenBalancesModel {
    static useData = useNearTokenData;
}
