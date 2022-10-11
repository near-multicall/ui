import { IconLabel, NearIcons } from "../../../shared/ui/components";

import { FungibleTokenFormat } from "../lib/ft-format";
import { FungibleTokenBalancesModel } from "../model/ft-balances";
import { type FungibleTokenEntity } from "../config";

interface FungibleTokensBalancesRenderProps extends FungibleTokenEntity.Dependencies {}

export const fungibleTokensBalancesRender = ({ contracts }: FungibleTokensBalancesRenderProps) => {
    const { data } = FungibleTokenBalancesModel.useAllTokensFrom(contracts);

    return !data
        ? null
        : data.map(({ dao, metadata, multicall, total }) => [
              <IconLabel
                  icon={metadata.icon ?? <NearIcons.GenericTokenFilled />}
                  label={metadata.symbol}
              />,

              FungibleTokenFormat.amountToDisplayAmount(multicall, metadata.decimals),
              FungibleTokenFormat.amountToDisplayAmount(dao, metadata.decimals),
              FungibleTokenFormat.amountToDisplayAmount(total, metadata.decimals),
          ]);
};
