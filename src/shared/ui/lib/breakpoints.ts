import { useMediaQuery, useTheme } from "@mui/material";
import { Breakpoint } from "@mui/material/styles";

export const useBreakpoint = (breakpoint: Breakpoint = "sm") => {
    const theme = useTheme();

    return useMediaQuery(theme.breakpoints.down(breakpoint));
};
