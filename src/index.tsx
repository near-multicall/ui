import "@near-wallet-selector/modal-ui/styles.css";
import ReactDOM from "react-dom";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";

import { AppPage } from "./pages/app";
import { DaoPage } from "./pages/dao/dao";
import { Wallet } from "./entities";
import { DialogsLayer, Sidebar } from "./widgets";
import "./shared/lib/persistent";

window.PAGE = "app";

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
                            <DaoPage />
                            <DialogsLayer />
                        </>
                    }
                />
            </Routes>
        </HashRouter>
    </Wallet.SelectorContextProvider>,

    document.querySelector("#root")
);
