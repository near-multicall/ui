import React, { Component } from 'react'
import './global.scss'
import { Layout, Header } from './components.js'
import './utils/loader.ts'

export default class App extends Component {

  render() {

    return (
      <>
        <Header/>
        <Layout/>
      </>
    );
  
  }

}