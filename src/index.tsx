import "@near-wallet-selector/modal-ui/styles.css";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";

import { AppPage } from "./pages/app";
import { DAOPage } from "./pages/dao/dao";
import { Wallet } from "./entities";
import { DialogsLayer, Sidebar } from "./widgets";
import "./shared/lib/persistent";

const appMountPoint = document.querySelector("#root") ?? document.createElement("div");

appMountPoint.setAttribute("id", "root");

createRoot(appMountPoint).render(
    <Wallet.SelectorContextProvider>
        <HashRouter>
            <Routes>
                <Route
                    path="/"
                    element={
                        <Navigate
                            to="/app"
                            replace
                        />
                    }
                />

                <Route
                    path="/app"
                    element={
                        <>
                            <Sidebar full={true} />
                            <AppPage />
                            <DialogsLayer />
                        </>
                    }
                />

                <Route
                    path="/dao"
                    element={
                        <>
                            <Sidebar full={true} />
                            <DAOPage />
                            <DialogsLayer />
                        </>
                    }
                />
            </Routes>
        </HashRouter>
    </Wallet.SelectorContextProvider>
);
