import { CheckCircleRounded, ContentCopy } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import clsx from "clsx";
import { forwardRef, HTMLProps, MutableRefObject, useCallback, useEffect, useState } from "react";

import { Tooltip } from "../tooltip";

import "./link.scss";

export interface LinkProps extends Omit<HTMLProps<HTMLAnchorElement>, "children" | "href"> {
    href: Required<HTMLProps<HTMLAnchorElement>>["href"];
    noTooltip?: boolean;
    label?: string;
}

export const Link = ({ className, href, label, noTooltip = false, ...props }: LinkProps) => {
    const text = label && label.length > 0 ? label : href;

    const Element = forwardRef(
        ({ className: forwardedClassName, ...forwardedProps }: HTMLProps<HTMLAnchorElement>, ref) => (
            <a
                className={clsx("Link", forwardedClassName, className)}
                target="_blank"
                ref={ref as MutableRefObject<HTMLAnchorElement>}
                rel="noopener noreferrer"
                {...{ ...forwardedProps, ...props, href }}
            >
                {text}
            </a>
        )
    );

    const [copied, copiedStateUpdate] = useState(false);

    const onCopyButtonClick = useCallback(
        async () => void copiedStateUpdate(!Boolean(await navigator.clipboard.writeText(text))),
        [text]
    );

    useEffect(
        () => void (copied ? setTimeout(() => void copiedStateUpdate(false), 1000) : null),
        [copied, copiedStateUpdate]
    );

    return noTooltip ? (
        <Element />
    ) : (
        <Tooltip
            arrow
            classes={{ arrow: "Link-tooltip-arrow", tooltip: "Link-tooltip" }}
            content={
                <IconButton
                    classes={{ root: "Link-tooltip-button" }}
                    disabled={copied}
                    onClick={onCopyButtonClick}
                    size="small"
                >
                    {!copied ? (
                        <ContentCopy
                            color="inherit"
                            fontSize="large"
                        />
                    ) : (
                        <CheckCircleRounded
                            color="inherit"
                            fontSize="large"
                        />
                    )}
                </IconButton>
            }
            leaveDelay={400}
            placement="right"
        >
            <Element />
        </Tooltip>
    );
};
