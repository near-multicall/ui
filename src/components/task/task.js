import React, { Component } from 'react'
import { Draggable } from 'react-beautiful-dnd';
import { Family } from '../../components';
import './task.scss'

export default class Task extends Component {

    render() {

        return (
            <Draggable 
                draggableId={this.props.task.id} 
                index={this.props.index}
            >
                { provided => (
                    <div 
                        className="task-wrapper"
                        {...provided.dragHandleProps}
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                    >
                        <Family.BaseTask>
                            { this.props.task.content }
                        </Family.BaseTask>
                    </div>
                )}
            </Draggable>
        );

    }

}