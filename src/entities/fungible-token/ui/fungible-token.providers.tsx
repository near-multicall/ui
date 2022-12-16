import { PropsWithChildren } from "react";

import { FTModel, FTModelInputs } from "../model/fungible-token.model";

export interface FTBalancesProviderProps
    extends Pick<PropsWithChildren, "children">,
        Pick<FTModelInputs["balances"], "accountId"> {}

export const FTBalancesProvider = ({ children, ...modelInputs }: FTBalancesProviderProps) => (
    <FTModel.BalancesContext.Provider value={FTModel.useBalancesState(modelInputs)}>
        {children}
    </FTModel.BalancesContext.Provider>
);
