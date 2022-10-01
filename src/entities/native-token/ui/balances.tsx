import { TokenLabel } from "../../../shared/ui/components";
import type { DaoContracts } from "../../types";
import { NativeTokenBalancesModel } from "../model/balances";

interface NativeTokenBalancesRenderProps {
    contracts: DaoContracts;
}

export const nativeTokenBalancesRender = ({ contracts }: NativeTokenBalancesRenderProps) => {
    const { data } = NativeTokenBalancesModel.useData(contracts);

    return !data ? null : [<TokenLabel native />, data.multicall, data.dao, data.total];
};
