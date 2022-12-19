import clsx from "clsx";
import { HTMLProps } from "react";

import { SettingsEditor, SettingsEditorProps } from "../../../widgets";

import "./settings.scss";

const _DAOSettingsTab = "DAOSettingsTab";

interface DAOSettingsTabProps extends HTMLProps<HTMLDivElement>, SettingsEditorProps {}

export const DAOSettingsTab = {
    render: ({ className, dao, ...props }: DAOSettingsTabProps) => ({
        content: (
            <div
                className={clsx(_DAOSettingsTab, className)}
                {...props}
            >
                <SettingsEditor {...{ dao }} />
            </div>
        ),

        name: "Settings",
    }),
};
