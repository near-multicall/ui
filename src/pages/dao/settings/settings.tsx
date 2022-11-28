import clsx from "clsx";
import { HTMLProps } from "react";

import { SettingsEditor, SettingsEditorModule } from "../../../widgets";

import "./settings.scss";

interface DaoSettingsTabUIProps extends HTMLProps<HTMLDivElement>, SettingsEditorModule.Inputs {}

const _DaoSettingsTab = "DaoSettingsTab";

const DaoSettingsTabUI = ({ className, adapters, ...props }: DaoSettingsTabUIProps) => (
    <div
        className={clsx(_DaoSettingsTab, className)}
        {...props}
    >
        <SettingsEditor.UI {...{ adapters }} />
    </div>
);

export const DaoSettingsTab = {
    uiConnect: (props: DaoSettingsTabUIProps) => ({
        content: <DaoSettingsTabUI {...props} />,
        name: "Settings",
    }),
};
