import { useEffect, useState } from "react";

import { Big, formatTokenAmount } from "../../../shared/lib/converter";
import { viewAccount } from "../../../shared/lib/wallet";
import { FRACTIONAL_PART_LENGTH, type Dependencies } from "../config";

type NearTokenDataFxResponse = {
    data: { dao: string; multicall: string; total: string } | null;
    loading: boolean;
};

const nearTokenDataFx = async (
    { dao, multicall }: Dependencies["contracts"],
    callback: (result: NearTokenDataFxResponse) => void
) => {
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

const useNearTokenData = (contracts: Dependencies["contracts"]) => {
    const [state, stateUpdate] = useState<NearTokenDataFxResponse>({ data: null, loading: true });

    useEffect(() => void nearTokenDataFx(contracts, stateUpdate), []);

    return state;
};

export class NearTokenBalancesModel {
    static useTokenFrom = useNearTokenData;
}
