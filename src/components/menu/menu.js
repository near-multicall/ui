import React, { Component } from 'react';
import { Droppable } from 'react-beautiful-dnd';
import Icon from '@mui/material/Icon';

import TabsListUnstyled from '@mui/base/TabUnstyled';
import TabUnstyled from '@mui/base/TabUnstyled';
import TabsUnstyled from '@mui/base/TabsUnstyled';
import TabPanelUnstyled from '@mui/base/TabPanelUnstyled';

import { Column } from '../../components.js';
import './menu.scss';

export default class Menu extends Component {

    constructor(props) {

        super(props);

        this.state = {
            expanded: false,
            tab: "1"
        }

    }

    componentDidMount() {

        window.MENU = this;

    }

    handleChange = (event, newValue) => this.setState({tab: newValue});
    
    render() {

        const { expanded,tab } = this.state;

        const LAYOUT = this.props.layout; // ususally global parameter

        const menuColumn = LAYOUT.getColumns()['menu'],
            trashColumn = LAYOUT.getColumns()['trash'];

        return (
            <div className={`menu-container ${expanded ? "expanded-menu" : ""}`}>
                <TabsUnstyled 
                    value={tab}
                    className="tabs"
                >
                    <TabsListUnstyled 
                        onChange={this.handleChange} 
                        aria-label="tab list" 
                        className="tab-list"
                    >
                        <TabUnstyled label="Item One" value="1">Build</TabUnstyled>
                        <TabUnstyled label="Item Two" value="2">Edit</TabUnstyled>
                        <TabUnstyled label="Item Three" value="3">Export</TabUnstyled>
                    </TabsListUnstyled>
                    <TabPanelUnstyled 
                        value="1" 
                        className="tab-panel"
                    >
                        <div className="menu-column-wrapper">
                            <Droppable
                                droppableId="special"
                                type="special"
                            >
                                { provided => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                    >
                                        <div 
                                            className="selector"
                                        >
                                            <Column 
                                                key={'menu'} 
                                                column={menuColumn} 
                                                tasks={menuColumn.taskIds.map(taskId => LAYOUT.getTasks()[taskId])} 
                                                index={LAYOUT.getColumnID()}
                                            />
                                        </div>
                                        <div 
                                            className="trash"
                                        >
                                            <Column 
                                                key={'trash'} 
                                                column={trashColumn} 
                                                tasks={trashColumn.taskIds.map(taskId => LAYOUT.getTasks()[taskId])} 
                                                index={LAYOUT.getColumnID() + 1}
                                            />
                                        </div>
                                    </div>
                                ) }
                            </Droppable>
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
                    </TabPanelUnstyled>
                </TabsUnstyled>
            </div>
        );

    }

}