import { PropsWithChildren } from "react";

import { MIModel, MIModelInputs } from "../model/mi-model";

export interface MIContextProviderProps extends Pick<PropsWithChildren, "children">, MIModelInputs {}

export const MIContextProvider = ({ children, ...modelInputs }: MIContextProviderProps) => (
    <MIModel.Context.Provider value={MIModel.usePropertiesState(modelInputs)}>{children}</MIModel.Context.Provider>
);
