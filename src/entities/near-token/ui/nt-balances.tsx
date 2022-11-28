import { IconLabel, NearIcon } from "../../../shared/ui/design";

import { NEARTokenBalancesModel } from "../model/near-balances";
import { type NEARToken } from "../context";

interface NTBalancesRenderProps extends NEARToken.Inputs {}

export const ntBalancesRender = ({ adapters }: NTBalancesRenderProps) => {
    const { data } = NEARTokenBalancesModel.useTokenFrom(adapters);

    return !data
        ? null
        : {
              content: [
                  <IconLabel
                      icon={<NearIcon.NativeTokenFilled />}
                      label="NEAR"
                  />,

                  data.multicall,
                  data.dao,
                  data.total,
              ],

              id: "NEAR",
          };
};
