import { ComponentProps } from "react";

import { MI } from "../../entities";

import { SettingsManagerUI, type SettingsManagerUIProps } from "./settings-manager.ui";

export interface ISettingsManager extends SettingsManagerUIProps {
    accountId: ComponentProps<typeof MI["ContextProvider"]>["daoAddress"];
}

export const SettingsManager = ({ accountId, ...props }: ISettingsManager) => (
    <MI.ContextProvider daoAddress={accountId}>
        <SettingsManagerUI {...props} />
    </MI.ContextProvider>
);
