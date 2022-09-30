import clsx from "clsx";
import React from "react";

import "./item.scss";

const _TabsItem = "Tabs-item",
    _TabsItemButton = `${_TabsItem}-button`;

export interface TabsItemButtonProps extends React.HTMLAttributes<HTMLDivElement> {
    invertedColors?: boolean;
    onClick: VoidFunction;
    title: string;
}

export const TabsItemButton = ({ className, invertedColors = false, onClick, title }: TabsItemButtonProps) => (
    <button
        className={clsx(
            {
                _TabsItemButton,
                [`${_TabsItemButton}--invertedColors`]: invertedColors,
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
    <div className={clsx(`${_TabsItem}-panel`, className)}>{children}</div>
);
