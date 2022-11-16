import { ContentCopy } from "@mui/icons-material";
import { Button } from "@mui/material";
import { forwardRef, HTMLProps, MutableRefObject, useCallback } from "react";

import { Tooltip } from "../tooltip";

import "./link.scss";

export interface LinkProps extends Omit<HTMLProps<HTMLAnchorElement>, "children" | "href"> {
    href: Required<HTMLProps<HTMLAnchorElement>>["href"];
    noTooltip?: boolean;
    label?: string;
}

const _Link = "Link";

export const Link = ({ href, label, noTooltip = false, ...props }: LinkProps) => {
    const text = label && label.length > 0 ? label : href;

    const Element = forwardRef((forwardedProps, ref) => (
        <a
            className={_Link}
            target="_blank"
            ref={ref as MutableRefObject<HTMLAnchorElement>}
            rel="noopener noreferrer"
            {...{ ...forwardedProps, ...props, href }}
        >
            {text}
        </a>
    ));

    return noTooltip ? (
        <Element />
    ) : (
        <Tooltip
            arrow
            classes={{ arrow: `${_Link}-tooltip-arrow`, tooltip: `${_Link}-tooltip` }}
            content={
                <Button
                    classes={{ root: `${_Link}-tooltip-button` }}
                    onClick={useCallback(() => void navigator.clipboard.writeText(text), [text])}
                    startIcon={
                        <ContentCopy
                            color="inherit"
                            fontSize="inherit"
                        />
                    }
                >
                    Copy
                </Button>
            }
            leaveDelay={2000}
            placement="right-end"
        >
            <Element />
        </Tooltip>
    );
};
