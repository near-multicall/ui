import { Tooltip as MuiTooltip, TooltipProps as MuiTooltipProps } from "@mui/material";

import "./index.scss";

interface TooltipProps extends MuiTooltipProps {
    title: string;
}

export const Tooltip = ({ children, title, ...props }: TooltipProps) => (
    <MuiTooltip
        title={<h1 className="tooltip-title">{title}</h1>}
        {...props}
    >
        {children}
    </MuiTooltip>
);
