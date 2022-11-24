import { useEffect, useState } from "react";

import { Big, formatTokenAmount } from "../../../shared/lib/converter";
import { viewAccount } from "../../../shared/lib/wallet";

import { NEARConfig, type NEAREntity } from "../config";

type NEARDataFxResponse = {
    data: { dao: string; multicall: string; total: string } | null;
    loading: boolean;
};

const nearTokenDataFx = async (
    { dao, multicall }: NEAREntity.Inputs["contracts"],
    callback: (result: NEARDataFxResponse) => void
) => {
    const [daoAccInfo, multicallAccInfo] = await Promise.all([
        viewAccount(dao.address),
        viewAccount(multicall.address),
    ]);

    const daoRawBalance = daoAccInfo.amount,
        multicallRawBalance = multicallAccInfo.amount;

    return callback({
        data: {
            dao: formatTokenAmount(daoRawBalance, 24, NEARConfig.FRACTIONAL_PART_LENGTH),
            multicall: formatTokenAmount(multicallRawBalance, 24, NEARConfig.FRACTIONAL_PART_LENGTH),

            total: formatTokenAmount(
                Big(daoRawBalance).add(multicallRawBalance).toFixed(),
                24,
                NEARConfig.FRACTIONAL_PART_LENGTH
            ),
        },

        loading: false,
    });
};

const useNEARData = (contracts: NEAREntity.Inputs["contracts"]) => {
    const [state, stateUpdate] = useState<NEARDataFxResponse>({ data: null, loading: true });

    useEffect(() => void nearTokenDataFx(contracts, stateUpdate), [contracts, stateUpdate]);

    return state;
};

export class NEARBalancesModel {
    static useTokenFrom = useNEARData;
}
