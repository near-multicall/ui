import clsx from "clsx";
import { type ComponentProps } from "react";
import { ObjectInspector } from "react-inspector";

import { UiKitConfig } from "../config";

import "./data-inspector.scss";

interface DataInspectorProps extends ComponentProps<typeof ObjectInspector> {
    classes?: { root?: string; body?: string; label?: string };
    label: string;
}

const _DataInspector = "DataInspector";

export const DataInspector = ({ classes, expandLevel = 1, label, ...props }: DataInspectorProps) => (
    <details className={clsx(_DataInspector, classes?.root)}>
        <summary className={clsx(`${_DataInspector}-label`, classes?.label)}>{label}</summary>

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
