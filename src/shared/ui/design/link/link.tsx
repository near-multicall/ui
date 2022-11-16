import { ContentCopy } from "@mui/icons-material";
import { Button, IconButton } from "@mui/material";
import clsx from "clsx";
import { forwardRef, HTMLProps, MutableRefObject, useCallback } from "react";

import { Tooltip } from "../tooltip";

import "./link.scss";

export interface LinkProps extends Omit<HTMLProps<HTMLAnchorElement>, "children" | "href"> {
    href: Required<HTMLProps<HTMLAnchorElement>>["href"];
    noTooltip?: boolean;
    label?: string;
}

const _Link = "Link";

export const Link = ({ className, href, label, noTooltip = false, ...props }: LinkProps) => {
    const text = label && label.length > 0 ? label : href;

    const Element = forwardRef(
        ({ className: forwardedClassName, ...forwardedProps }: HTMLProps<HTMLAnchorElement>, ref) => (
            <a
                className={clsx(_Link, forwardedClassName, className)}
                target="_blank"
                ref={ref as MutableRefObject<HTMLAnchorElement>}
                rel="noopener noreferrer"
                {...{ ...forwardedProps, ...props, href }}
            >
                {text}
            </a>
        )
    );

    return noTooltip ? (
        <Element />
    ) : (
        <Tooltip
            arrow
            classes={{ arrow: `${_Link}-tooltip-arrow`, tooltip: `${_Link}-tooltip` }}
            content={
                <IconButton
                    classes={{ root: `${_Link}-tooltip-button` }}
                    onClick={useCallback(() => void navigator.clipboard.writeText(text), [text])}
                    size="small"
                >
                    <ContentCopy
                        color="inherit"
                        fontSize="large"
                    />
                </IconButton>
            }
            leaveDelay={1000}
            placement="right"
        >
            <Element />
        </Tooltip>
    );
};
