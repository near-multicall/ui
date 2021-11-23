import 'regenerator-runtime/runtime'
import React from 'react'
import './global.scss'
import { Header, Recipe, Fridge, Board, Cook } from './components.js'

// import { login, logout } from './utils'

import getConfig from './config'
const { networkId } = getConfig(process.env.NODE_ENV || 'development')

export default function App() {

  return (
    <>
      <Header/>
      <Recipe/>
      <Fridge/>
      <Board/>
      <Cook/>
    </>
  )
}
