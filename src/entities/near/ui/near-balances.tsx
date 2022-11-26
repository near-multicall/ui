import { IconLabel, NearIcon } from "../../../shared/ui/design";

import { NEARTokenBalancesModel } from "../model/near-balances";
import { type NEARTokenEntity } from "../context";

interface NEARTokenBalancesRenderProps extends NEARTokenEntity.Inputs {}

export const nearTokenBalancesRender = ({ contracts }: NEARTokenBalancesRenderProps) => {
    const { data } = NEARTokenBalancesModel.useTokenFrom(contracts);

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
