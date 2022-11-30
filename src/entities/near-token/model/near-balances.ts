import { useEffect, useState } from "react";

import { Big, formatTokenAmount } from "../../../shared/lib/converter";
import { viewAccount } from "../../../shared/lib/wallet";
import { ModuleContext, type NEARToken } from "../context";

type NEARTokenDataFxResponse = {
    data: { dao: string; multicall: string; total: string } | null;
    loading: boolean;
};

const nearTokenDataFx = async (
    { dao, multicallInstance }: NEARToken.Inputs["adapters"],
    callback: (result: NEARTokenDataFxResponse) => void
) => {
    const [daoAccInfo, multicallAccInfo] = await Promise.all([
        viewAccount(dao.address),
        viewAccount(multicallInstance.address),
    ]);

    const daoRawBalance = daoAccInfo.amount,
        multicallRawBalance = multicallAccInfo.amount;

    return callback({
        data: {
            dao: formatTokenAmount(daoRawBalance, 24, ModuleContext.FRACTIONAL_PART_LENGTH),
            multicall: formatTokenAmount(multicallRawBalance, 24, ModuleContext.FRACTIONAL_PART_LENGTH),

            total: formatTokenAmount(
                Big(daoRawBalance).add(multicallRawBalance).toFixed(),
                24,
                ModuleContext.FRACTIONAL_PART_LENGTH
            ),
        },

        loading: false,
    });
};

const useNEARTokenData = (adapters: NEARToken.Inputs["adapters"]) => {
    const [state, stateUpdate] = useState<NEARTokenDataFxResponse>({ data: null, loading: true });

    useEffect(() => void nearTokenDataFx(adapters, stateUpdate), [adapters, stateUpdate]);

    return state;
};

export class NEARTokenBalancesModel {
    static useTokenFrom = useNEARTokenData;
}
