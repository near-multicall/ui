import { HTMLProps } from "react";

import "./placeholder-content.scss";

interface NoDataContentProps extends HTMLProps<HTMLDivElement> {}

export const NoDataContent = ({ className }: NoDataContentProps) => <span {...{ className }}>No data.</span>;

export interface UnknownErrorContentProps extends HTMLProps<HTMLDivElement> {
    payload?: { error?: Error };
}

export const UnknownErrorContent = ({ className, payload }: UnknownErrorContentProps) => (
    <span {...{ className }}>{payload?.error?.message ?? "Unknown error."}</span>
);
