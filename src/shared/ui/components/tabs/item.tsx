import clsx from "clsx";
import React from "react";

import "./item.scss";

const NAMESPACE = "TabsItem";

export interface TabsItemButtonProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    onClick: VoidFunction;
}

export const TabsItemButton = ({ className, onClick, title }: TabsItemButtonProps) => (
    <button
        className={clsx(`${NAMESPACE}-button`, className)}
        {...{ onClick }}
    >
        {title}
    </button>
);

export interface TabsItemPanelProps extends React.PropsWithChildren, React.HTMLAttributes<HTMLDivElement> {}

export const TabsItemPanel = ({ children, className }: TabsItemPanelProps) => (
    <div className={clsx(`${NAMESPACE}-panel`, className)}>{children}</div>
);
