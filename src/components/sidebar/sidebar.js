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
                        <span className="env" env={window.NEAR_ENV}>
                            <ScienceOutlinedIcon className="icon"/>
                        </span>
                    </div>
                    <nav>
                        <NavLink className={({ isActive }) => isActive ? "active" : ""} to="/app">App</NavLink>
                        <NavLink className={({ isActive }) => isActive ? "active" : ""} to="/dao">Dao</NavLink>
                    </nav>
                    <hr/>
                    <a target="_blank" rel="noopener" href='https://twitter.com/near_multicall'>
                        <img src={Twitter} alt="Twitter"/>
                    </a>
                    <a target="_blank" rel="noopener" href='https://discord.gg/wc6T6bPvdr'>
                        <img src={Discord} alt="Discord"/>
                    </a>
                    <a target="_blank" rel="noopener" href='https://github.com/near-multicall'>
                        <img src={Github} alt="Github"/>
                    </a>
                    {/* <img src={Telegram}/> */}
                    <Wallet/>
                </div>
            </div>
        );

    }

}