import clsx from "clsx";
import { HTMLProps } from "react";

import { MI } from "../../../entities";
import { SettingsEditor, SettingsEditorProps } from "../../../widgets";

import "./settings.scss";

const _DaoSettingsTab = "DaoSettingsTab";

interface DaoSettingsTabProps extends HTMLProps<HTMLDivElement>, SettingsEditorProps {}

const Content = ({ className, adapters, ...props }: DaoSettingsTabProps) => (
    <MI.PropertiesProvider daoAddress={adapters.dao.address}>
        <div
            className={clsx(_DaoSettingsTab, className)}
            {...props}
        >
            <SettingsEditor {...{ adapters }} />
        </div>
    </MI.PropertiesProvider>
);

Content.displayName = _DaoSettingsTab;

export const DaoSettingsTab = {
    render: (props: DaoSettingsTabProps) => ({
        content: <Content {...props} />,
        name: "Settings",
    }),
};
