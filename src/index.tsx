import ReactDOM from "react-dom";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppPage } from "./pages/app";
import { DaoPage } from "./pages/dao/dao";
import { Wallet } from "./entities";
import "./shared/lib/persistent";
import "@near-wallet-selector/modal-ui/styles.css";
import { Sidebar } from "./widgets";

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
                        </>
                    }
                />

                <Route
                    path="/dao"
                    element={
                        <>
                            <Sidebar full={true} />
                            <DaoPage />
                        </>
                    }
                />
            </Routes>
        </HashRouter>
    </Wallet.SelectorContextProvider>,

    document.querySelector("#root")
);
