import "@near-wallet-selector/modal-ui/styles.css";
import { lazy, Suspense } from "react";
import ReactDOM from "react-dom";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";

const AppPage = lazy(() => import("./pages/app"));
const DaoPage = lazy(() => import("./pages/dao"));
import { Wallet } from "./entities";
import { DialogsLayer, Sidebar } from "./widgets";
import "./shared/lib/persistent";

ReactDOM.render(
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
                                <DaoPage />
                            </Suspense>
                            <DialogsLayer />
                        </>
                    }
                />
            </Routes>
        </HashRouter>
    </Wallet.SelectorContextProvider>,

    document.querySelector("#root")
);
