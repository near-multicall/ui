import clsx from "clsx";
import { MouseEvent, useCallback, useState, type ComponentProps } from "react";
import { ObjectInspector } from "react-inspector";

import { UiKitConfig } from "../config";

import "./data-inspector.scss";

interface DataInspectorProps extends ComponentProps<typeof ObjectInspector> {
    classes?: { root?: string; body?: string; label?: string };
    expanded?: boolean;
    label?: string;
}

const _DataInspector = "DataInspector";

export const DataInspector = ({ classes, expanded = false, expandLevel = 1, label, ...props }: DataInspectorProps) => {
    // TODO: Extract custom `<details>` element to separate component.

    const [rootExpanded, rootExpandedUpdate] = useState<boolean>(expanded),
        dynamicLabel = rootExpanded ? "hide" : "show";

    const rootExpansionToggle = useCallback(
        (event: MouseEvent) => {
            event.preventDefault();
            rootExpandedUpdate(!rootExpanded);
        },

        [rootExpanded, rootExpandedUpdate]
    );

    return (
        <details
            className={clsx(_DataInspector, classes?.root)}
            onClick={rootExpansionToggle}
            open={rootExpanded}
        >
            <summary className={clsx(`${_DataInspector}-label`, classes?.label)}>{label ?? dynamicLabel}</summary>

            <div className={clsx(`${_DataInspector}-body`, classes?.body)}>
                <ObjectInspector
                    expandLevel={expandLevel < 1 ? 1 : expandLevel}
                    // @ts-ignore Built-in typings seems broken
                    theme={UiKitConfig.OBJECT_INSPECTOR_THEME}
                    {...props}
                />
            </div>
        </details>
    );
};
