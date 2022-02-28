import React, { Component } from 'react';
import { Header } from './components.js';
import { Outlet } from "react-router-dom";
import './utils/loader.ts';

export default class App extends Component {

  render() {

    return (
      <>
        <Header/>
        <Outlet/>
      </>
    );
  
  }

}