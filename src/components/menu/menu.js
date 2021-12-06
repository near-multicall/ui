import React, { Component } from 'react';
import Icon from '@mui/material/Icon';
import { Builder, Editor } from '../../components';
import './menu.scss';

export default class Menu extends Component {

    constructor(props) {

        super(props);

        this.state = {
            expanded: false,
            tab: 0
        }

    }

    componentDidMount() {

        window.MENU = this;

    }

    changeTab = newTab => this.setState({tab: newTab});

    render() {

        const { expanded, tab } = this.state;

        const LAYOUT = this.props.layout; // ususally global parameter

        return (
            <div className={`menu-container ${expanded ? "expanded-menu" : ""}`}>
                <div className="tabs">
                    <div className="tab-list">
                        <button 
                            className={`tab ${tab === 0 ? "active-tab" : ""}`} 
                            onClick={() => this.changeTab(0)}
                        >
                            Build
                        </button>
                        <button 
                            className={`tab ${tab === 1 ? "active-tab" : ""}`} 
                            onClick={() => this.changeTab(1)}
                        >
                            Edit
                        </button>
                        <button 
                            className={`tab ${tab === 2 ? "active-tab" : ""}`} 
                            onClick={() => this.changeTab(2)}
                        >
                            Export
                        </button>
                    </div>
                    <div className={`${tab != 0 ? "hidden" : "active-panel"}`} >
                        <Builder layout={LAYOUT} menu={this} />
                    </div>
                    <div className={`${tab != 1 ? "hidden" : "active-panel"}`} >
                        <Editor/>
                    </div>
                    <div 
                        value={2}
                        className={`${tab != 2 ? "hidden" : "active-panel"} tab-panel`}
                    >
                        <p>third</p>
                    </div>
                    <div className={`toggle-size ${expanded ? "collapse" : "expand"}`}>
                        <Icon
                            className="icon"
                            onClick={ () => {
                                LAYOUT.setExpanded(!expanded);
                                this.setState({ expanded: !expanded });
                            }}
                        >
                            navigate_before
                        </Icon>
                    </div>
                </div>
            </div>
        );

    }

}