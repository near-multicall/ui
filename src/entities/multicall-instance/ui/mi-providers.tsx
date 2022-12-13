import { PropsWithChildren } from "react";

import { SputnikDAO } from "../../../shared/lib/contracts/sputnik-dao";
import { MIModel } from "../model/mi-model";

export interface MIPropertiesProviderProps extends PropsWithChildren {
    daoAddress: SputnikDAO["address"];
}

export const MIPropertiesProvider = ({ children, daoAddress }: MIPropertiesProviderProps) => (
    <MIModel.PropertiesContext.Provider value={MIModel.usePropertiesState(daoAddress)}>
        {children}
    </MIModel.PropertiesContext.Provider>
);
