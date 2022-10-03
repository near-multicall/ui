import { PreviewOutlined } from "@mui/icons-material";

import { PopupMenu, PopupMenuProps } from "../../../shared/ui/components";
import { DappLoginConfig as Config } from "../config";
import { DappLoginDialogsModel } from "../model/dapp-login-dialogs";

interface DappLoginMenuProps extends Pick<PopupMenuProps, "triggerClassName"> {
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
