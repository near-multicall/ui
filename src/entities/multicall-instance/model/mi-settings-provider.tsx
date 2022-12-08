import { PropsWithChildren } from "react";

import { MI } from "../module-context";

import { MISettingsModel } from "./mi-settings";

interface MISettingsProviderProps extends PropsWithChildren, Pick<MI.Inputs, "daoAddress"> {}

export const MISettingsProvider = ({ children, daoAddress }: MISettingsProviderProps) => (
    <MISettingsModel.Context.Provider value={MISettingsModel.useData(daoAddress)}>
        {children}
    </MISettingsModel.Context.Provider>
);
