import clsx from "clsx";
import { HTMLProps } from "react";

import { MulticallConfigEditor, type MulticallConfigEditorWidget } from "../../../widgets";

import "./config.scss";

interface DaoConfigTabUIProps extends HTMLProps<HTMLDivElement>, MulticallConfigEditorWidget.Dependencies {}

const _DaoConfigTab = "DaoConfigTab";

const DaoConfigTabUI = ({ className, contracts, ...props }: DaoConfigTabUIProps) => (
    <div
        className={clsx(_DaoConfigTab, className)}
        {...props}
    >
        <MulticallConfigEditor.UI {...{ contracts }} />
    </div>
);

export const DaoConfigTab = {
    uiConnect: (props: DaoConfigTabUIProps) => ({
        content: <DaoConfigTabUI {...props} />,
        name: "Config",
    }),
};
