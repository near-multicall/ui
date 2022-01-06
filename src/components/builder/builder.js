import React, { Component } from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { Column } from '../../components.js';
import './builder.scss';

export default class Builder extends Component {

    render() {

        const LAYOUT = this.props.layout; // ususally global parameter

        const { mini } = LAYOUT.state;

        const menuColumn = LAYOUT.getColumns()['menu'],
            trashColumn = LAYOUT.getColumns()['trash'];

        return (
            <div 
                value={0}
                className="tab-panel"
            >
                <Droppable
                    droppableId="special"
                    type="special"
                >
                    { provided => (
                        <div
                            className="builder-container"
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                        >
                            <div 
                                className={`${mini ? "mini-" : ""}selector`}
                            >
                                <Column 
                                    key={'menu'} 
                                    column={menuColumn}
                                    direction={mini ? "horizontal" : "vertical"}
                                    tasks={menuColumn.taskIds.map(taskId => LAYOUT.getTasks()[taskId])} 
                                    index={LAYOUT.getColumnID()}
                                />
                            </div>
                            <div 
                                className={`${mini ? "mini-" : ""}trash`}
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
        );

    }

}