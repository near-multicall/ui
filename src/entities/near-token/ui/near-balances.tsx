import { TokenLabel } from "../../../shared/ui/components";
import type { DaoContracts } from "../../types";
import { NearTokenBalancesModel } from "../model/near-balances";

interface NearTokenBalancesRenderProps {
    contracts: DaoContracts;
}

export const nearTokenBalancesRender = ({ contracts }: NearTokenBalancesRenderProps) => {
    const { data } = NearTokenBalancesModel.useData(contracts);

    return !data ? null : [<TokenLabel native />, data.multicall, data.dao, data.total];
};
