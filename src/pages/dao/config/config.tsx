import clsx from "clsx";
import { HTMLProps } from "react";

import { MulticallConfigEditor, type MulticallConfigEditorWidget } from "../../../widgets";

import "./config.scss";

interface DaoConfigTabUIProps extends HTMLProps<HTMLDivElement>, MulticallConfigEditorWidget.Dependencies {}

const _DaoConfigTab = "DaoConfigTab";

const DaoConfigTabUI = ({ className, controllerContractAddress, multicallContract, ...props }: DaoConfigTabUIProps) => (
    <div
        className={clsx(_DaoConfigTab, className)}
        {...props}
    >
        <MulticallConfigEditor.UI {...{ controllerContractAddress, multicallContract }} />
    </div>
);

export const DaoConfigTab = {
    uiConnect: (props: DaoConfigTabUIProps) => ({
        content: <DaoConfigTabUI {...props} />,
        name: "Config",
    }),
};
