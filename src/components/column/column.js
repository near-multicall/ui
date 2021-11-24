import React, { Component } from 'react'
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { Task } from '../../components.js'
import './column.scss';

export default class Column extends Component {

    render() {

        return (
            <Draggable
                draggableId={this.props.column.id}
                index={this.props.index}
            >
                { provided => (
                    <div 
                        className="column-container"
                        {...provided.draggableProps}
                        ref={provided.innerRef}
                    >
                        <h3
                            {...provided.dragHandleProps}
                        >
                            { this.props.column.title }
                        </h3>
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
                                    { this.props.tasks.map((task, index) => <Task key={task.id} task={task} index={index} />) }
                                    { provided.placeholder }
                                </div>
                            )}
                        </Droppable>
                    </div>
                ) }
            </Draggable>
        );

    }

}