import { useContext } from "react";

import { IconLabel, NearIcon } from "../../../shared/ui/design";
import { NEARTokenFormat } from "../lib/near-token.format";
import { NEARTokenModel } from "../model/near-token.model";

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

                  NEARTokenFormat.amountToDisplayAmount(data.multicallInstance),
                  NEARTokenFormat.amountToDisplayAmount(data.account),
                  NEARTokenFormat.amountToDisplayAmount(data.total),
              ],

              id: "NEAR",
          };
};
