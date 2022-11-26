import { useEffect, useState } from "react";

import { Big, formatTokenAmount } from "../../../shared/lib/converter";
import { viewAccount } from "../../../shared/lib/wallet";

import { NEARTokenModuleContext, type NEARTokenEntity } from "../context";

type NEARTokenDataFxResponse = {
    data: { dao: string; multicall: string; total: string } | null;
    loading: boolean;
};

const nearTokenDataFx = async (
    { dao, multicall }: NEARTokenEntity.Inputs["contracts"],
    callback: (result: NEARTokenDataFxResponse) => void
) => {
    const [daoAccInfo, multicallAccInfo] = await Promise.all([
        viewAccount(dao.address),
        viewAccount(multicall.address),
    ]);

    const daoRawBalance = daoAccInfo.amount,
        multicallRawBalance = multicallAccInfo.amount;

    return callback({
        data: {
            dao: formatTokenAmount(daoRawBalance, 24, NEARTokenModuleContext.FRACTIONAL_PART_LENGTH),
            multicall: formatTokenAmount(multicallRawBalance, 24, NEARTokenModuleContext.FRACTIONAL_PART_LENGTH),

            total: formatTokenAmount(
                Big(daoRawBalance).add(multicallRawBalance).toFixed(),
                24,
                NEARTokenModuleContext.FRACTIONAL_PART_LENGTH
            ),
        },

        loading: false,
    });
};

const useNEARTokenData = (contracts: NEARTokenEntity.Inputs["contracts"]) => {
    const [state, stateUpdate] = useState<NEARTokenDataFxResponse>({ data: null, loading: true });

    useEffect(() => void nearTokenDataFx(contracts, stateUpdate), [contracts, stateUpdate]);

    return state;
};

export class NEARTokenBalancesModel {
    static useTokenFrom = useNEARTokenData;
}
