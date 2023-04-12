import "@near-wallet-selector/modal-ui/styles.css";
import { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";

import { Wallet } from "../entities";
import { AppPage } from "../pages/app";
import { DAOPage } from "../pages/dao";
import { DialogsLayer, Sidebar } from "../widgets";
import "../shared/lib/persistent";

const appMountPoint = document.querySelector("#root") ?? document.createElement("div");

appMountPoint.setAttribute("id", "root");

createRoot(appMountPoint).render(
    <Wallet.ContextProvider>
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
                            <Suspense fallback={<div>Loading...</div>}>
                                <AppPage />
                            </Suspense>
                            <DialogsLayer />
                        </>
                    }
                />

                <Route
                    path="/dao"
                    element={
                        <>
                            <Sidebar full={true} />
                            <Suspense fallback={<div>Loading...</div>}>
                                <DAOPage />
                            </Suspense>
                            <DialogsLayer />
                        </>
                    }
                />
            </Routes>
        </HashRouter>
    </Wallet.ContextProvider>
);
