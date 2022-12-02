import { PreviewOutlined } from "@mui/icons-material";
import { ComponentProps } from "react";

import { PopupMenu } from "../../../shared/ui/design";
import { ModuleContext as ModuleContext } from "../module-context";
import { ELDialogsModel } from "../model/el-dialogs";

interface ELMenuProps extends Pick<ComponentProps<typeof PopupMenu>, "triggerClassName"> {
    FeatureFlags: {
        ExternalLogin: Record<keyof typeof ModuleContext.METHODS, boolean>;
    };
}

export const ELMenu = ({ FeatureFlags, triggerClassName }: ELMenuProps) => (
    <PopupMenu
        icon={<PreviewOutlined />}
        items={Object.values(ModuleContext.METHODS).map(({ title, type }) => ({
            disabled: !FeatureFlags.ExternalLogin[type],
            key: type,
            onClick: () => ELDialogsModel.dialogOpenRequested(type),
            title,
        }))}
        {...{ triggerClassName }}
    />
);
