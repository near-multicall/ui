import { PreviewOutlined } from "@mui/icons-material";
import { ComponentProps } from "react";

import { PopupMenu } from "../../../shared/ui/design";
import { ModuleContext } from "../module-context";
import { ELModel } from "../model/external-login.model";

interface ELMenuProps extends Pick<ComponentProps<typeof PopupMenu>, "triggerClassName"> {
    FeatureFlags: {
        ExternalLogin: Record<keyof typeof ModuleContext.methods, boolean>;
    };
}

export const ELMenu = ({ FeatureFlags, triggerClassName }: ELMenuProps) => (
    <PopupMenu
        icon={<PreviewOutlined />}
        items={Object.values(ModuleContext.methods).map(({ title, type }) => ({
            disabled: !FeatureFlags.ExternalLogin[type],
            key: type,
            onClick: () => ELModel.dialogOpenRequested(type),
            title,
        }))}
        {...{ triggerClassName }}
    />
);
