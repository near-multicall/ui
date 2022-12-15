import { IconLabel, NearIcon } from "../../../shared/ui/design";

import { NEARTokenBalancesModel } from "../model/nt-model";
import { NEARToken } from "../module-context";

export interface NEARTokenBalancesProps extends NEARToken.Inputs {}

export const nearTokenBalancesRender = ({ adapters }: NEARTokenBalancesProps) => {
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
