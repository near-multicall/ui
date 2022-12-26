import { ComponentProps } from "react";

import { MulticallInstance } from "../../entities";

import { MulticallSettingsManagerUI, type MulticallSettingsManagerUIProps } from "./ui/multicall-settings-manager.ui";

export interface MulticallSettingsManagerProps extends MulticallSettingsManagerUIProps {
    accountId: ComponentProps<typeof MulticallInstance["ContextProvider"]>["daoAddress"];
}

export const MulticallSettingsManager = ({ accountId, ...props }: MulticallSettingsManagerProps) => (
    <MulticallInstance.ContextProvider daoAddress={accountId}>
        <MulticallSettingsManagerUI {...props} />
    </MulticallInstance.ContextProvider>
);
