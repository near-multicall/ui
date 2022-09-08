import React from "react";
import { Layout, Sidebar } from "../components.js";

export const AppPage = () => {
    window.PAGE = "app";

    return (
        <>
            <Sidebar />
            <Layout />
        </>
    );
};
