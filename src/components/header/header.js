import React, { Component } from 'react';
import { Wallet } from '../../components';
import { Icon } from '@mui/material';
import './header.scss';

export default class Header extends Component {

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
                    <Wallet/>
                </div>
                <div className={`empty-container ${window?.LAYOUT?.expanded ? "expanded-empty" : ""}`}></div>
            </div>
        );

    }

}