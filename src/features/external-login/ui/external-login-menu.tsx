import { PreviewOutlined } from "@mui/icons-material";
import { ComponentProps } from "react";

import { PopupMenu } from "../../../shared/ui/design";
import { ModuleContext } from "../module-context";
import { ExternalLoginDialogsModel } from "../model/external-login-dialogs";

interface MenuProps extends Pick<ComponentProps<typeof PopupMenu>, "triggerClassName"> {
    FeatureFlags: {
        ExternalLogin: Record<keyof typeof ModuleContext.METHODS, boolean>;
    };
}

const _ExternalLoginMenu = "ExternalLoginMenu";

export const Menu = ({ FeatureFlags, triggerClassName }: MenuProps) => (
    <PopupMenu
        icon={<PreviewOutlined />}
        items={Object.values(ModuleContext.METHODS).map(({ title, type }) => ({
            disabled: !FeatureFlags.ExternalLogin[type],
            key: type,
            onClick: () => ExternalLoginDialogsModel.dialogOpenRequested(type),
            title,
        }))}
        {...{ triggerClassName }}
    />
);

Menu.displayName = _ExternalLoginMenu;
