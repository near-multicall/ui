import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from './App';
import AppPage from './pages/app-page';
import DaoPage from './pages/dao-page';

ReactDOM.render(
  <BrowserRouter basename="/multicall-UI">
    <Routes>
      <Route path="/" element={<App />}>
        <Route path="/" element={<AppPage />} />
        <Route path="app" element={<AppPage />} />
        <Route path="dao" element={<DaoPage />} />
      </Route>
    </Routes>
  </BrowserRouter>,
  document.querySelector('#root')
);
