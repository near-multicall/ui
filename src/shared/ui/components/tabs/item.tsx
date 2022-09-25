import clsx from "clsx";
import React from "react";

import "./item.scss";

const NAMESPACE = "Tabs-item";

export interface TabsItemButtonProps extends React.HTMLAttributes<HTMLDivElement> {
    invertedColors?: boolean;
    onClick: VoidFunction;
    title: string;
}

export const TabsItemButton = ({ className, invertedColors = false, onClick, title }: TabsItemButtonProps) => (
    <button
        className={clsx(
            {
                [`${NAMESPACE}-button`]: true,
                [`${NAMESPACE}-button--invertedColors`]: invertedColors,
            },
            className
        )}
        {...{ onClick }}
    >
        {title}
    </button>
);

export interface TabsItemPanelProps extends React.PropsWithChildren, React.HTMLAttributes<HTMLDivElement> {}

export const TabsItemPanel = ({ children, className }: TabsItemPanelProps) => (
    <div className={clsx(`${NAMESPACE}-panel`, className)}>{children}</div>
);
