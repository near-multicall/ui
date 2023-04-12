import { Tooltip as MuiTooltip, TooltipProps as MuiTooltipProps } from "@mui/material";

import "./tooltip.scss";

interface TooltipProps extends Omit<MuiTooltipProps, "title"> {
    content: MuiTooltipProps["title"];
}

export const Tooltip = ({ children, content, ...props }: TooltipProps) => (
    <MuiTooltip
        title={
            typeof content === "string" && content.length > 0 ? <h1 className="Tooltip-title">{content}</h1> : content
        }
        {...props}
    >
        {children}
    </MuiTooltip>
);
