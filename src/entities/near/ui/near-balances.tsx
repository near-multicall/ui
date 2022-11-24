import { IconLabel, NearIcon } from "../../../shared/ui/design";

import { NEARBalancesModel } from "../model/near-balances";
import { type NEAREntity } from "../config";

interface NEARBalancesRenderProps extends NEAREntity.Inputs {}

export const nearTokenBalancesRender = ({ contracts }: NEARBalancesRenderProps) => {
    const { data } = NEARBalancesModel.useTokenFrom(contracts);

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
