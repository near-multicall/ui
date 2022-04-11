import { Icon } from '@mui/material';
import React, { Component } from 'react';
import { NavLink } from "react-router-dom";
import { Wallet } from '../../components';
import './header.scss';

export default class Header extends Component {

    full = false;

    constructor(props) {

        super(props);

        this.full = props.full ?? this.full;
        
    }

    componentDidMount() {

        window.HEADER = this;

    }

    render() {

        return (
            <div className="header-wrapper">
                <div className="header-container">
                    <div className="title">
                        <Icon className="logo">dynamic_feed</Icon>
                        <h1>near-multicall</h1>
                    </div>
                    <nav>
                        <NavLink className={({ isActive }) => isActive ? "active" : ""} to="/app">App</NavLink>
                        <NavLink className={({ isActive }) => isActive ? "active" : ""} to="/dao">Dao</NavLink>
                    </nav>
                    <Wallet/>
                </div>
                { !this.full 
                    ? <div className={`empty-container ${window?.LAYOUT?.expanded ? "expanded-empty" : ""}`}></div>
                    : <div className="space-right"></div>
                }
            </div>
        );

    }

}