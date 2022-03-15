import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from './App';
import AppPage from './pages/app-page';
import DaoPage from './pages/dao-page';

ReactDOM.render(
  <BrowserRouter>
    <Routes>
        <Route path="/multicall-UI/" element={<div>Base</div>} />
        <Route path="/multicall-UI/app" element={<div>App</div>} />
        <Route path="/multicall-UI/dao" element={<div>Dao</div>} />
      {/* <Route path="/multicall-UI" element={<App />}>
        <Route path="/multicall-UI/" element={<AppPage />} />
        <Route path="/multicall-UI/app" element={<AppPage />} />
        <Route path="/multicall-UI/dao" element={<DaoPage />} />
      </Route> */}
    </Routes>
  </BrowserRouter>,
  document.querySelector('#root')
);
