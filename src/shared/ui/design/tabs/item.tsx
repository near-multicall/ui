import clsx from "clsx";
import React from "react";

import "./item.scss";

export interface TabsItemButtonProps extends React.HTMLAttributes<HTMLDivElement> {
    invertedColors?: boolean;
    onClick: VoidFunction;
    label: string;
}

export const TabsItemButton = ({ className, invertedColors = false, label, onClick }: TabsItemButtonProps) => (
    <button
        className={clsx("Tabs-item-button", { ["Tabs-item-button--invertedColors"]: invertedColors }, className)}
        {...{ onClick }}
    >
        {label}
    </button>
);

export interface TabsItemPanelProps extends React.PropsWithChildren, React.HTMLAttributes<HTMLDivElement> {}

export const TabsItemPanel = ({ children, className }: TabsItemPanelProps) => (
    <div className={clsx("Tabs-item-panel", className)}>{children}</div>
);
