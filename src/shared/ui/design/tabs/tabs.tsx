import clsx from "clsx";
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";

import { TabsItemButton, TabsItemButtonProps, TabsItemPanel } from "./item";
import { TabsLayout, TabsLayoutProps } from "./layout";

interface TabsProps extends Pick<TabsItemButtonProps, "invertedColors"> {
    activeItemIndexOverride?: number;
    activeItemSwitchOverride?: Dispatch<SetStateAction<number>>;
    classes?: TabsLayoutProps["classes"] & {};
    items: { content: JSX.Element; lazy?: boolean; name: string }[];
}

export const Tabs = ({
    activeItemIndexOverride,
    activeItemSwitchOverride,
    classes,
    invertedColors,
    items,
}: TabsProps) => {
    const [activeItemIndex, activeItemSwitch] =
        activeItemIndexOverride === undefined || activeItemSwitchOverride === undefined
            ? useState<number>(0)
            : [activeItemIndexOverride, activeItemSwitchOverride];

    const activeItemSwitchBond = useCallback(
        (itemIndex: number) => () => activeItemSwitch(itemIndex),
        [activeItemSwitch, items]
    );

    return (
        <TabsLayout
            {...{ classes }}
            buttons={items.map(({ name }, itemIndex) => (
                <TabsItemButton
                    className={clsx({ "is-active": activeItemIndex === itemIndex })}
                    key={itemIndex}
                    label={name}
                    onClick={activeItemSwitchBond(itemIndex)}
                    {...{ invertedColors }}
                />
            ))}
        >
            {items.map(({ content, lazy = false }, itemIndex) =>
                activeItemIndex === itemIndex || !lazy ? (
                    <TabsItemPanel
                        className={clsx({ "is-active": activeItemIndex === itemIndex })}
                        key={itemIndex}
                    >
                        {content}
                    </TabsItemPanel>
                ) : null
            )}
        </TabsLayout>
    );
};
