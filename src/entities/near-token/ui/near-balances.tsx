import { TokenLabel } from "../../../shared/ui/components";
import type { DaoContracts } from "../../types";
import { NearTokenBalancesModel } from "../model/near-balances";

interface NearTokenBalancesRenderProps {
    daoContracts: DaoContracts;
}

export const nearTokenBalancesRender = ({ daoContracts }: NearTokenBalancesRenderProps) => {
    const { data } = NearTokenBalancesModel.useData(daoContracts);

    return !data ? null : [<TokenLabel native />, data.multicall, data.dao, data.total];
};
