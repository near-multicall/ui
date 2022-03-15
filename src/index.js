import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter, Routes, Route } from "react-router-dom";
import App from './App';
import AppPage from './pages/app-page';
import DaoPage from './pages/dao-page';

ReactDOM.render(
  <HashRouter>
    <Routes>
        <Route path="/" element={<div>Base</div>} />
        <Route path="/app" element={<div>App</div>} />
        <Route path="/dao" element={<div>Dao</div>} />
      {/* <Route path="/multicall-UI" element={<App />}>
        <Route path="/multicall-UI/" element={<AppPage />} />
        <Route path="/multicall-UI/app" element={<AppPage />} />
        <Route path="/multicall-UI/dao" element={<DaoPage />} />
      </Route> */}
    </Routes>
  </HashRouter>,
  document.querySelector('#root')
);
