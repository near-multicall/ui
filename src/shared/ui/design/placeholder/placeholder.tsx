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

export const Placeholder = ({ className, payload, type }: PlaceholderProps) => (
    <div className={clsx("Placeholder", `Placeholder--${type}`, className)}>
        {h(contentByType[type], {
            className: `Placeholder-content Placeholder-content--${type}`,
            payload,
        })}
    </div>
);
