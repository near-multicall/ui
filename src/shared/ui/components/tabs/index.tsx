import { Tabs as MuiTabs, Tab, Box } from "@mui/material";
import clsx from "clsx";
import React, { Fragment, useCallback } from "react";

interface Props {
    titles: string[] | JSX.Element[];
    content: React.ReactNode[];
    fontWeight?: number;
}

export const Tabs = ({ titles, content }: Props) => {
    const [activeТаbIndex, activeTabSwitch] = React.useState(0);

    const onChange = useCallback(
        (_event: React.ChangeEvent<any>, value: any) => activeTabSwitch(value),
        [activeTabSwitch]
    );

    return (
        <Box sx={{ width: "100%" }}>
            <Box>
                <MuiTabs
                    allowScrollButtonsMobile
                    scrollButtons="auto"
                    sx={{ mb: -1, marginRight: 0 }}
                    TabIndicatorProps={{ style: { display: "none" } }}
                    value={activeТаbIndex}
                    {...{ onChange }}
                >
                    {titles.map((title, index) => (
                        <Tab
                            disableRipple
                            key={index}
                            label={title}
                            sx={{
                                width: 116,
                                height: 44,
                                ml: "19px",
                                mb: "35px",
                                mt: "20px",
                                fontFamily: "Titillium Web",
                                fontWeight: "bold",
                                textTransform: "none",
                                borderRadius: 1,
                                background: "transparent",
                                color: "#e0e0e0",
                                fontSize: "16px",
                                border: "1px solid #e0e0e0 ",
                                opacity: 1,

                                "&.Mui-selected": {
                                    background: "#A4BAB8",
                                    color: "#2a2a2a",
                                    borderColor: "#000000",
                                },
                            }}
                        />
                    ))}
                </MuiTabs>
            </Box>

            {content.map(
                (tabPanelContent, tabIndex) =>
                    activeТаbIndex === tabIndex && <Fragment key={tabIndex}>{tabPanelContent}</Fragment>
            )}
        </Box>
    );
};
