import { IconLabel, NearIcon } from "../../../shared/ui/design";
import { FTFormat } from "../lib/ft-format";
import { FTInfoModel } from "../model/ft-info";
import { FT } from "../module-context";

interface FTBalancesProps extends FT.Inputs {}

export const ftBalances = ({ adapters }: FTBalancesProps) => {
    const { data } = FTInfoModel.useNonZeroBalances(adapters);

    return !data
        ? null
        : data.map(({ dao, metadata, multicall, total }) => ({
              content: [
                  <IconLabel
                      icon={metadata.icon ?? <NearIcon.GenericTokenFilled />}
                      label={metadata.symbol}
                  />,

                  FTFormat.amountToDisplayAmount(multicall, metadata.decimals),
                  FTFormat.amountToDisplayAmount(dao, metadata.decimals),
                  FTFormat.amountToDisplayAmount(total, metadata.decimals),
              ],

              id: metadata.symbol,
          }));
};
