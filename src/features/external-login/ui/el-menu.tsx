import { PreviewOutlined } from "@mui/icons-material";
import { ComponentProps } from "react";

import { PopupMenu } from "../../../shared/ui/design";
import { Config as Config } from "../config";
import { ELDialogsModel } from "../model/el-dialogs";

interface ELMenuProps extends Pick<ComponentProps<typeof PopupMenu>, "triggerClassName"> {
    FeatureFlags: {
        ExternalLogin: Record<keyof typeof Config.METHODS, boolean>;
    };
}

export const ELMenu = ({ FeatureFlags, triggerClassName }: ELMenuProps) => (
    <PopupMenu
        icon={<PreviewOutlined />}
        items={Object.values(Config.METHODS).map(({ title, type }) => ({
            disabled: !FeatureFlags.ExternalLogin[type],
            key: type,
            onClick: () => ELDialogsModel.dialogOpenRequested(type),
            title,
        }))}
        {...{ triggerClassName }}
    />
);
