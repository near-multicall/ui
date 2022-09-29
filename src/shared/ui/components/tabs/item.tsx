import clsx from "clsx";
import React from "react";

import "./item.scss";

const TabsItemNamespace = "Tabs-item",
    TabsItemButtonNamespace = `${TabsItemNamespace}-button`;

export interface TabsItemButtonProps extends React.HTMLAttributes<HTMLDivElement> {
    invertedColors?: boolean;
    onClick: VoidFunction;
    title: string;
}

export const TabsItemButton = ({ className, invertedColors = false, onClick, title }: TabsItemButtonProps) => (
    <button
        className={clsx(
            {
                [TabsItemButtonNamespace]: true,
                [`${TabsItemButtonNamespace}--invertedColors`]: invertedColors,
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
    <div className={clsx(`${TabsItemNamespace}-panel`, className)}>{children}</div>
);
