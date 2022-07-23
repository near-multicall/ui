import React, { Component } from 'react'
import { Droppable, Draggable } from 'react-beautiful-dnd';
import Icon from '@mui/material/Icon';
import { Task } from '../../components.js'
import { nanoid } from 'nanoid';
import './column.scss';

export default class Column extends Component {

    render() {

        console.log(this.props.column.id);

        const menuColumn = this.props.column.id === 'menu';

        return (
            <Draggable
                draggableId={this.props.column.id}
                index={this.props.index}
                {...this.props}
            >
                { (provided, snapshot) => 
                    <div 
                        className="column-container"
                        showpseudo={ snapshot.isDragging
                            ? "no"
                            : "yes"
                        }
                        { ...(!menuColumn
                            ? provided.draggableProps 
                            : {}
                        ) }
                        ref={provided.innerRef}
                    >
                        { !menuColumn
                            ? <>
                                <Icon
                                    className="drag-handle"
                                    {...provided.dragHandleProps}
                                >drag_handle</Icon>
                                <Icon 
                                    className="delete-column"
                                    onClick={ () => LAYOUT.deleteColumn(this.props.index) }
                                >delete_outline</Icon>
                            </>
                            : <div 
                                className="hidden"
                                {...provided.dragHandleProps}
                            ></div>
                        }
                        <Droppable 
                            droppableId={this.props.column.id}
                            type="task"
                        >
                            { provided => (
                                <div 
                                    className="tasks-wrapper"
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                >
                                    { this.props.tasks.map((task, index) => {
                                        let t = <Task key={nanoid()} task={task} index={index} json={task.json}/>
                                        return t;
                                    }) }
                                    { provided.placeholder }
                                </div>
                            ) }
                        </Droppable>
                        { !menuColumn && 
                            <Icon 
                                className="add-column"
                                onClick={ () => LAYOUT.addColumn() }
                            >add</Icon> 
                        }
                    </div>
                }
            </Draggable>
        );

    }

}