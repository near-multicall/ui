import clsx from "clsx";
import { useCallback, useState } from "react";

import { TabsItemButton, TabsItemButtonProps, TabsItemPanel } from "./item";
import { TabsLayout, TabsLayoutProps } from "./layout";

interface TabsProps extends Pick<TabsItemButtonProps, "invertedColors"> {
    classes?: TabsLayoutProps["classes"] & {};
    items: { content: JSX.Element; lazy?: boolean; title: string }[];
}

export const Tabs = ({ classes, invertedColors, items }: TabsProps) => {
    const [activeТаbIndex, activeTabSwitch] = useState<number>(0);

    const itemButtonClickHandler = useCallback(
        (itemIndex: number) => () => activeTabSwitch(itemIndex),
        [activeTabSwitch]
    );

    const buttons = items.map(({ title }, tabIndex) => (
        <TabsItemButton
            className={clsx({ "is-active": activeТаbIndex === tabIndex })}
            key={tabIndex}
            onClick={itemButtonClickHandler(tabIndex)}
            {...{ invertedColors, title }}
        />
    ));

    return (
        <TabsLayout {...{ buttons, classes }}>
            {items.map(({ content, lazy = false }, tabIndex) =>
                activeТаbIndex === tabIndex || !lazy ? (
                    <TabsItemPanel
                        className={clsx({ "is-active": activeТаbIndex === tabIndex })}
                        key={tabIndex}
                    >
                        {content}
                    </TabsItemPanel>
                ) : null
            )}
        </TabsLayout>
    );
};
