import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import { Icon } from '@mui/material';
import React, { Component } from 'react';
import { NavLink } from "react-router-dom";
import { Wallet } from '../../components';
import Discord from '../../assets/discord.svg'
import Twitter from '../../assets/twitter.svg'
import Telegram from '../../assets/telegram.svg'
import Github from '../../assets/github.svg'
import './sidebar.scss';

export default class Sidebar extends Component {

    componentDidMount() {

        window.SIDEBAR = this;

    }

    render() {

        return (
            <div className="sidebar-wrapper">
                <div className="sidebar-container">
                    <div className="title">
                        <Icon className="logo">dynamic_feed</Icon>
                        <span className="env" env={window.ENVIRONMENT}>
                            <ScienceOutlinedIcon className="icon"/>
                        </span>
                    </div>
                    <nav>
                        <NavLink className={({ isActive }) => isActive ? "active" : ""} to="/app">App</NavLink>
                        <NavLink className={({ isActive }) => isActive ? "active" : ""} to="/dao">Dao</NavLink>
                    </nav>
                    <hr/>
                    <img src={Twitter} onClick={() => window.open('https://twitter.com/near_multicall')}/>
                    <img src={Discord} onClick={() => window.open('https://discord.gg/wc6T6bPvdr')}/>
                    <img src={Github} onClick={() => window.open('https://github.com/near-multicall')}/>
                    {/* <img src={Telegram}/> */}
                    <Wallet/>
                </div>
            </div>
        );

    }

}