import clsx from "clsx";
import { HTMLProps } from "react";

import { MIEntityConfigEditor, type MIEntityConfigEditorWidget } from "../../../widgets";

import "./config.scss";

interface DaoConfigTabUIProps extends HTMLProps<HTMLDivElement>, MIEntityConfigEditorWidget.Dependencies {}

const _DaoConfigTab = "DaoConfigTab";

const DaoConfigTabUI = ({ className, controllerContractAddress, multicallContract, ...props }: DaoConfigTabUIProps) => (
    <div
        className={clsx(_DaoConfigTab, className)}
        {...props}
    >
        <MIEntityConfigEditor.UI {...{ controllerContractAddress, multicallContract }} />
    </div>
);

export const DaoConfigTab = {
    uiConnect: (props: DaoConfigTabUIProps) => ({
        content: <DaoConfigTabUI {...props} />,
        name: "Config",
    }),
};
