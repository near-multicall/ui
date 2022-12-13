import { PropsWithChildren } from "react";

import { Entity } from "../module-context";
import { MIPropertiesModel } from "../model/mi-properties";

interface MIPropertiesProviderProps extends PropsWithChildren, Pick<Entity.Inputs, "daoAddress"> {}

export const MIPropertiesProvider = ({ children, daoAddress }: MIPropertiesProviderProps) => (
    <MIPropertiesModel.Context.Provider value={MIPropertiesModel.useData(daoAddress)}>
        {children}
    </MIPropertiesModel.Context.Provider>
);
