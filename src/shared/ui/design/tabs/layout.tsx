import clsx from "clsx";
import React from "react";

import "./layout.scss";

interface TabsLayoutButtonsPanelProps extends React.PropsWithChildren, React.HTMLAttributes<HTMLDivElement> {}

const TabsLayoutButtonsPanel = ({ children, className }: TabsLayoutButtonsPanelProps) => (
    <div className={clsx("Tabs-layout-buttonsPanel", className)}>{children}</div>
);

interface TabsLayoutContentSpaceProps extends React.PropsWithChildren, React.HTMLAttributes<HTMLDivElement> {}

const TabsLayoutContentSpace = ({ children, className }: TabsLayoutContentSpaceProps) => (
    <div className={clsx("Tabs-layout-contentSpace", className)}>{children}</div>
);

export interface TabsLayoutProps extends React.PropsWithChildren {
    buttons: JSX.Element[];
    classes?: { root?: string; buttonsPanel?: string; contentSpace?: string };
}

export const TabsLayout = ({ buttons, children, classes }: TabsLayoutProps) => (
    <div className={clsx("Tabs-layout", classes?.root)}>
        <TabsLayoutButtonsPanel className={classes?.buttonsPanel}>{buttons}</TabsLayoutButtonsPanel>
        <TabsLayoutContentSpace className={classes?.contentSpace}>{children}</TabsLayoutContentSpace>
    </div>
);
