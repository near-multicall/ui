import { useContext } from "react";
import { IconLabel, NearIcon } from "../../../shared/ui/design";
import { FTFormat } from "../lib/ft-format";
import { FTModel } from "../model/ft-model";

export interface FTBalancesProps {
    nonZeroOnly?: boolean;
}

export const ftBalancesRender = ({ nonZeroOnly = false }: FTBalancesProps) => {
    const { data } = useContext(FTModel.BalancesContext);

    return !data
        ? null
        : data.map(({ account, metadata, multicall, total }) => ({
              content: [
                  <IconLabel
                      icon={metadata.icon ?? <NearIcon.GenericTokenFilled />}
                      label={metadata.symbol}
                  />,

                  FTFormat.amountToDisplayAmount(multicall, metadata.decimals),
                  FTFormat.amountToDisplayAmount(account, metadata.decimals),
                  FTFormat.amountToDisplayAmount(total, metadata.decimals),
              ],

              id: metadata.symbol,
          }));
};
