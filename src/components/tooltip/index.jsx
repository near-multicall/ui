import { Tooltip as MuiTooltip } from "@mui/material";

import "./index.scss";

export const Tooltip = ({ children, title, ...props }) => (
    <MuiTooltip
        title={<h1 className="tooltip-title">{title}</h1>}
        {...props}
    >
        {children}
    </MuiTooltip>
);
