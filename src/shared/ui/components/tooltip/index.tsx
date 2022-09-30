import { Tooltip as MuiTooltip, TooltipProps as MuiTooltipProps } from "@mui/material";

import "./tooltip.scss";

const _Tooltip = "Tooltip";

interface TooltipProps extends MuiTooltipProps {
    title: string;
}

export const Tooltip = ({ children, title, ...props }: TooltipProps) => (
    <MuiTooltip
        title={<h1 className={`${_Tooltip}-title`}>{title}</h1>}
        {...props}
    >
        {children}
    </MuiTooltip>
);
