import { ComponentProps } from "react";

import { MulticallInstance } from "../../entities";

import { SettingsManagerUI, type SettingsManagerUIProps } from "./ui/settings-manager.ui";

export interface SettingsManagerProps extends SettingsManagerUIProps {
    accountId: ComponentProps<typeof MulticallInstance["ContextProvider"]>["daoAddress"];
}

export const SettingsManager = ({ accountId, ...props }: SettingsManagerProps) => (
    <MulticallInstance.ContextProvider daoAddress={accountId}>
        <SettingsManagerUI {...props} />
    </MulticallInstance.ContextProvider>
);
