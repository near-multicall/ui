import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter, Routes, Route } from "react-router-dom";
import App from './App';
import AppPage from './pages/app-page';
import DaoPage from './pages/dao-page';

ReactDOM.render(
  <HashRouter>
    <Routes>
      <Route path="/" element={<App />}>
        <Route path="/" element={<div>Base</div>} />
        <Route path="/app" element={<div>App</div>} />
        <Route path="/dao" element={<DaoPage />} />
      </Route>
    </Routes>
  </HashRouter>,
  document.querySelector('#root')
);
