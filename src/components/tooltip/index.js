import { Tooltip as MuiTooltip } from "@mui/material";

export const Tooltip = ({ children, title, ...props }) => (
    <MuiTooltip
        title={<h1 style={{ fontSize: "12px" }}>{title}</h1>}
        {...props}
    >
        {children}
    </MuiTooltip>
);
