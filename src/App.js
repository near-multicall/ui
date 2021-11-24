import React, { Component } from 'react'
import './global.scss'
import { Layout } from './components.js'

// import { login, logout } from './utils'

import getConfig from './config'
const { networkId } = getConfig(process.env.NODE_ENV || 'development')

export default class App extends Component {

  render() {

    return (
      <>
        <Layout/>
      </>
    );
  
  }

}