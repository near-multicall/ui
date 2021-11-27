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
                { (provided, snapshot) => (
                    <div 
                        className="task-wrapper"
                        ref={provided.innerRef}
                        {...provided.dragHandleProps}
                        {...provided.draggableProps}
                        style={{
                            ...provided.draggableProps.style,
                            zIndex: snapshot.isDragging 
                                ? 10
                                : 1
                        }}
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