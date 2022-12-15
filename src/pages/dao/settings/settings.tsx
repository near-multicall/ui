import clsx from "clsx";
import { HTMLProps } from "react";

import { SettingsEditor, SettingsEditorProps } from "../../../widgets";

import "./settings.scss";

const _DaoSettingsTab = "DaoSettingsTab";

interface DaoSettingsTabProps extends HTMLProps<HTMLDivElement>, SettingsEditorProps {}

export const DaoSettingsTab = {
    render: ({ className, dao, ...props }: DaoSettingsTabProps) => ({
        content: (
            <div
                className={clsx(_DaoSettingsTab, className)}
                {...props}
            >
                <SettingsEditor {...{ dao }} />
            </div>
        ),

        name: "Settings",
    }),
};
