import clsx from "clsx";
import { HTMLProps } from "react";

import { SettingsEditor, SettingsEditorWidget } from "../../../widgets";

import "./settings.scss";

interface DaoSettingsTabUIProps extends HTMLProps<HTMLDivElement>, SettingsEditorWidget.Inputs {}

const _DaoSettingsTab = "DaoSettingsTab";

const DaoSettingsTabUI = ({ className, contracts, ...props }: DaoSettingsTabUIProps) => (
    <div
        className={clsx(_DaoSettingsTab, className)}
        {...props}
    >
        <SettingsEditor.UI {...{ contracts }} />
    </div>
);

export const DaoSettingsTab = {
    uiConnect: (props: DaoSettingsTabUIProps) => ({
        content: <DaoSettingsTabUI {...props} />,
        name: "Settings",
    }),
};
