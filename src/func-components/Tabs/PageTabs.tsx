import { Tab, TabProps } from "@mui/material";
import React from "react";

import { Tabs } from "./index";

const CustomTab = (props: TabProps) => (
    <Tab
        {...props}
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
);

export const PageTabs = ({ contents }: { contents: JSX.Element[] }) => (
    <Tabs
        titles={["Multicall", "DAO"]}
        contents={contents}
        CustomTab={CustomTab}
    />
);
