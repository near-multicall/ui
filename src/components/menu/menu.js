import React, { Component } from 'react'
import { Droppable } from 'react-beautiful-dnd';
import { Column } from '../../components.js'
import './menu.scss';

export default class Menu extends Component {


    render() {

        const LAYOUT = this.props.layout; // ususally global parameter

        const menuColumn = LAYOUT.getColumns()['menu'],
            trashColumn = LAYOUT.getColumns()['trash'];

        return (
            <div className="menu-container">
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
                </div>
            </div>
        );

    }

}