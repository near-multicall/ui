import React, { Component } from 'react'
import { Draggable } from 'react-beautiful-dnd';
import { Family } from '../../components';

export default class Task extends Component {

    render() {

        return (
            <Draggable 
                draggableId={this.props.task.id} 
                index={this.props.index}
            >
                { provided => (
                    <Family.BaseTask>
                        <div 
                            className="task-container"
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                        >
                            { this.props.task.content }
                        </div>
                    </Family.BaseTask>
                )}
            </Draggable>
        );

    }

}