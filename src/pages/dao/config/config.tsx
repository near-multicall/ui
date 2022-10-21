import clsx from "clsx";
import { HTMLProps } from "react";

import { DaoConfigEditor, type DaoConfigEditorWidget } from "../../../widgets";

import "./config.scss";

interface DaoConfigTabComponentProps extends HTMLProps<HTMLDivElement>, DaoConfigEditorWidget.Dependencies {}

const _DaoConfigTab = "DaoConfigTab";

const DaoConfigTabComponent = ({ className, ...props }: DaoConfigTabComponentProps) => (
    <div className={clsx(_DaoConfigTab, className)}>
        <DaoConfigEditor.UI {...props} />
    </div>
);

export const DaoConfigTab = {
    connect: (props: DaoConfigTabComponentProps) => ({
        content: <DaoConfigTabComponent {...props} />,
        name: "Config",
    }),
};
