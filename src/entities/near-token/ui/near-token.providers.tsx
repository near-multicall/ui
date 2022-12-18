import { PropsWithChildren } from "react";

import { NEARTokenModel, NEARTokenModelInputs } from "../model/near-token.model";

interface NEARTokenBalancesProviderProps
    extends Pick<PropsWithChildren, "children">,
        Pick<NEARTokenModelInputs["balances"], "accountId"> {}

export const NEARTokenBalancesProvider = ({ children, ...modelInputs }: NEARTokenBalancesProviderProps) => (
    <NEARTokenModel.BalancesContext.Provider value={NEARTokenModel.useBalancesState(modelInputs)}>
        {children}
    </NEARTokenModel.BalancesContext.Provider>
);
