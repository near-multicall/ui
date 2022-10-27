import clsx from "clsx";
import { HTMLProps, createElement as h } from "react";

import { NoDataContent, UnknownErrorContent, type UnknownErrorContentProps } from "./placeholder-content";
import "./placeholder.scss";

const contentByType = {
    noData: NoDataContent,
    unknownError: UnknownErrorContent,
};

interface PlaceholderProps extends HTMLProps<HTMLDivElement> {
    type: keyof typeof contentByType;
    payload?: UnknownErrorContentProps["payload"];
}
const _Placeholder = "Placeholder";

export const Placeholder = ({ className, payload, type }: PlaceholderProps) => (
    <div className={clsx(_Placeholder, `${_Placeholder}--${type}`, className)}>
        {h(contentByType[type], {
            className: clsx(`${_Placeholder}-content`, `${_Placeholder}-content--${type}`),
            payload,
        })}
    </div>
);
