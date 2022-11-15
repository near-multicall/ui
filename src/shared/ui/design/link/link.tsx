import { CopyAllOutlined } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { HTMLProps, useCallback } from "react";

import { Tooltip } from "../tooltip";

import "./link.scss";

export interface LinkProps extends Omit<HTMLProps<HTMLAnchorElement>, "children" | "href"> {
    href: Required<HTMLProps<HTMLAnchorElement>>["href"];
    noTooltip?: boolean;
    label?: string;
}

const _Link = "Link";

export const Link = ({ href, label, noTooltip = true, ...props }: LinkProps) => {
    const text = label && label.length > 0 ? label : href;

    const element = (
        <a
            className={_Link}
            target="_blank"
            rel="noopener noreferrer"
            {...{ ...props, href }}
        >
            {text}
        </a>
    );

    return noTooltip ? (
        element
    ) : (
        <Tooltip
            arrow
            classes={{ arrow: `${_Link}-tooltip-arrow`, tooltip: `${_Link}-tooltip` }}
            content={
                <IconButton
                    classes={{ root: `${_Link}-tooltip-button` }}
                    onClick={useCallback(() => void navigator.clipboard.writeText(text), [text])}
                >
                    <CopyAllOutlined
                        color="inherit"
                        fontSize="large"
                    />
                </IconButton>
            }
            followCursor
            leaveDelay={3000}
        >
            {element}
        </Tooltip>
    );
};
