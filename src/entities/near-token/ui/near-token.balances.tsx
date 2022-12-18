import { useContext } from "react";

import { formatTokenAmount } from "../../../shared/lib/converter";
import { IconLabel, NearIcon } from "../../../shared/ui/design";
import { NEARTokenModel } from "../model/near-token.model";
import { ModuleContext } from "../module-context";

export const nearTokenBalancesRender = () => {
    const { data } = useContext(NEARTokenModel.BalancesContext);

    return !data
        ? null
        : {
              content: [
                  <IconLabel
                      icon={<NearIcon.NativeTokenFilled />}
                      label="NEAR"
                  />,

                  formatTokenAmount(data.multicallInstance, 24, ModuleContext.FRACTIONAL_PART_LENGTH),
                  formatTokenAmount(data.account, 24, ModuleContext.FRACTIONAL_PART_LENGTH),
                  formatTokenAmount(data.total, 24, ModuleContext.FRACTIONAL_PART_LENGTH),
              ],

              id: "NEAR",
          };
};
