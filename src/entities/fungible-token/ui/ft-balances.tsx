import { TokenLabel } from "../../../shared/ui/components";
import { FungibleTokenFormat } from "../lib/ft-format";
import { FungibleTokenBalancesModel } from "../model/ft-balances";
import { Dependencies } from "../config";

interface FungibleTokensBalancesRenderProps extends Dependencies {}

export const fungibleTokensBalancesRender = ({ contracts }: FungibleTokensBalancesRenderProps) => {
    const { data } = FungibleTokenBalancesModel.useAllTokensFrom(contracts);

    return !data
        ? null
        : data.map(({ dao, metadata, multicall, total }) => [
              <TokenLabel {...metadata} />,
              FungibleTokenFormat.amountToDisplayAmount(dao, metadata.decimals),
              FungibleTokenFormat.amountToDisplayAmount(multicall, metadata.decimals),
              FungibleTokenFormat.amountToDisplayAmount(total, metadata.decimals),
          ]);
};
