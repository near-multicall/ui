import { PreviewOutlined } from "@mui/icons-material";
import { ComponentProps } from "react";

import { PopupMenu } from "../../../shared/ui/design";
import { DappLoginConfig as Config } from "../config";
import { DappLoginDialogsModel } from "../model/dapp-login-dialogs";

interface DappLoginMenuProps extends Pick<ComponentProps<typeof PopupMenu>, "triggerClassName"> {
    FeatureFlags: {
        DappLogin: Record<keyof typeof Config.METHODS, boolean>;
    };
}

export const DappLoginMenu = ({ FeatureFlags, triggerClassName }: DappLoginMenuProps) => (
    <PopupMenu
        icon={<PreviewOutlined />}
        items={Object.values(Config.METHODS).map(({ title, type }) => ({
            disabled: !FeatureFlags.DappLogin[type],
            key: type,
            onClick: () => DappLoginDialogsModel.dialogOpenRequested(type),
            title,
        }))}
        {...{ triggerClassName }}
    />
);
