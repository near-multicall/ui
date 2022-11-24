import { IconLabel, NearIcon } from "../../../shared/ui/design";
import { FTFormat } from "../lib/ft-format";
import { FTInfoModel } from "../model/ft-info";
import { type FT } from "../config";

interface FTBalancesProps extends FT.Inputs {}

export const ftBalances = ({ contracts }: FTBalancesProps) => {
    const { data } = FTInfoModel.useNonZeroBalances(contracts);

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
