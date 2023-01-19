import { PropsWithChildren, useContext } from "react";

import { IconLabel, NEARIcon } from "../../shared/ui/design";

import { NEARLib } from "./near.lib";
import { NEARService, INEARService } from "./near.service";

interface NEARBalancesProviderProps extends Pick<PropsWithChildren, "children">, INEARService {}

export const NEARBalancesProvider = ({ children, ...modelInputs }: NEARBalancesProviderProps) => (
    <NEARService.BalancesContext.Provider value={NEARService.useBalancesState(modelInputs)}>
        {children}
    </NEARService.BalancesContext.Provider>
);

export const nearBalancesRender = () => {
    const { data } = useContext(NEARService.BalancesContext);

    return data === null
        ? data
        : {
              content: [
                  <IconLabel
                      icon={<NEARIcon.NativeTokenFilled />}
                      label="NEAR"
                  />,

                  NEARLib.amountToDisplayAmount(data.multicallInstance),
                  NEARLib.amountToDisplayAmount(data.account),
                  NEARLib.amountToDisplayAmount(data.total),
              ],

              id: "NEAR",
          };
};
