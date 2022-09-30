import ReactDOM from "react-dom";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppPage } from "./pages/app";
import { DaoPage } from "./pages/dao";
import { Wallet } from "./entities";
import "./shared/lib/persistent";
import "@near-wallet-selector/modal-ui/styles.css";

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
                    element={<AppPage />}
                />

                <Route
                    path="/dao"
                    element={<DaoPage />}
                />
            </Routes>
        </HashRouter>
    </Wallet.SelectorContextProvider>,

    document.querySelector("#root")
);
