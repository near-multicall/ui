import { CopyAllOutlined } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { HTMLProps } from "react";
import { Tooltip } from "../tooltip";

import "./link.scss";

export interface LinkProps extends Omit<HTMLProps<HTMLAnchorElement>, "children"> {
    noTooltip?: boolean;
    title?: string;
}

const _Link = "Link";

export const Link = ({ noTooltip = false, title, ...props }: LinkProps) => (
    <Tooltip
        arrow
        content={
            <IconButton onClick={() => {}}>
                <CopyAllOutlined fontSize="large" />
            </IconButton>
        }
    >
        <a
            className={_Link}
            target="_blank"
            rel="noopener noreferrer"
            {...props}
        >
            {title && title.length > 0 ? title : props.href}
        </a>
    </Tooltip>
);
