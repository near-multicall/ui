import clsx from "clsx";
import { HTMLProps } from "react";

import { SettingsEditor, SettingsEditorWidget } from "../../../widgets";

import "./config.scss";

interface DaoConfigTabUIProps extends HTMLProps<HTMLDivElement>, SettingsEditorWidget.Inputs {}

const _DaoConfigTab = "DaoConfigTab";

const DaoConfigTabUI = ({ className, contracts, ...props }: DaoConfigTabUIProps) => (
    <div
        className={clsx(_DaoConfigTab, className)}
        {...props}
    >
        <SettingsEditor.UI {...{ contracts }} />
    </div>
);

export const DaoConfigTab = {
    uiConnect: (props: DaoConfigTabUIProps) => ({
        content: <DaoConfigTabUI {...props} />,
        name: "Config",
    }),
};
