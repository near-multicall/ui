import { TokenLabel } from "../../../shared/ui/components";
import type { DaoContracts } from "../../types";
import { NativeTokenBalancesModel } from "../model/balances";

interface NativeTokenBalancesRenderProps {
    daoContracts: DaoContracts;
}

export const nativeTokenBalancesRender = ({ daoContracts }: NativeTokenBalancesRenderProps) => {
    const { data } = NativeTokenBalancesModel.useData(daoContracts);

    return !data ? null : [<TokenLabel native />, data.multicall, data.dao, data.total];
};
