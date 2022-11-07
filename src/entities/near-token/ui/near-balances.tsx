import { IconLabel, NearIcons } from "../../../shared/ui/components";

import { NearTokenBalancesModel } from "../model/near-balances";
import { type NearTokenEntity } from "../config";

interface NearTokenBalancesRenderProps extends NearTokenEntity.Inputs {}

export const nearTokenBalancesRender = ({ contracts }: NearTokenBalancesRenderProps) => {
    const { data } = NearTokenBalancesModel.useTokenFrom(contracts);

    return !data
        ? null
        : {
              content: [
                  <IconLabel
                      icon={<NearIcons.NativeTokenFilled />}
                      label="NEAR"
                  />,

                  data.multicall,
                  data.dao,
                  data.total,
              ],

              id: "NEAR",
          };
};
