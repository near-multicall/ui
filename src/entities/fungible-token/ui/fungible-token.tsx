import { TokenLabel } from "../../../shared/ui/components";
import type { DaoContracts } from "../../types";
import { FungibleTokenFormat } from "../lib/format";
import { FungibleTokenBalancesModel } from "../model/fungible-token";

interface FungibleTokensBalancesRenderProps {
    daoContracts: DaoContracts;
}

export const fungibleTokensBalancesRender = ({ daoContracts }: FungibleTokensBalancesRenderProps) => {
    const { data } = FungibleTokenBalancesModel.useAllData(daoContracts);

    return !data
        ? null
        : data.map(({ dao, metadata, multicall, total }) => [
              <TokenLabel {...metadata} />,
              FungibleTokenFormat.amountToDisplayAmount(dao, metadata.decimals),
              FungibleTokenFormat.amountToDisplayAmount(multicall, metadata.decimals),
              FungibleTokenFormat.amountToDisplayAmount(total, metadata.decimals),
          ]);
};
