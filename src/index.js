import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import AppPage from './pages/app-page';
import DaoPage from './pages/dao-page';
import './utils/persistent';

window.PAGE = "app";

ReactDOM.render(
  <HashRouter>
    <Routes>
      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="/app" element={<AppPage />} />
      <Route path="/dao" element={<DaoPage />} />
    </Routes>
  </HashRouter>,
  document.querySelector('#root')
);
