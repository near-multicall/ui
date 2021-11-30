import React, { Component } from 'react'
import { Droppable } from 'react-beautiful-dnd';
import Icon from '@mui/material/Icon';
import { Column } from '../../components.js'
import './menu.scss';

export default class Menu extends Component {

    constructor(props) {

        super(props);

        this.state = {
            export: false
        }

    }

    componentDidMount() {

        window.MENU = this;

    }

    render() {

        const { expanded } = this.state;

        const LAYOUT = this.props.layout; // ususally global parameter

        const menuColumn = LAYOUT.getColumns()['menu'],
            trashColumn = LAYOUT.getColumns()['trash'];

        return (
            <div className={`menu-container ${expanded ? "expanded-menu" : ""}`}>
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
            </div>
        );

    }

}