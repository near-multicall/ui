import { PropsWithChildren } from "react";

import { Entity } from "../module-context";
import { MISettingsModel } from "../model/mi-settings";

interface MISettingsProviderProps extends PropsWithChildren, Pick<Entity.Inputs, "daoAddress"> {}

export const MISettingsProvider = ({ children, daoAddress }: MISettingsProviderProps) => (
    <MISettingsModel.Context.Provider value={MISettingsModel.useData(daoAddress)}>
        {children}
    </MISettingsModel.Context.Provider>
);
