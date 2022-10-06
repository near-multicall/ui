import { TokenLabel } from "../../../shared/ui/components";
import { NearTokenBalancesModel } from "../model/near-balances";
import { type Dependencies } from "../config";

interface NearTokenBalancesRenderProps {
    contracts: Dependencies["contracts"];
}

export const nearTokenBalancesRender = ({ contracts }: NearTokenBalancesRenderProps) => {
    const { data } = NearTokenBalancesModel.useTokenFrom(contracts);

    return !data ? null : [<TokenLabel native />, data.multicall, data.dao, data.total];
};
