import React, { Component } from 'react'
import { Draggable } from 'react-beautiful-dnd';
import { Family } from '../../components';
import './task.scss'

export default class Task extends Component {

    getTaskType() {

        const { addr, func } = this.props.task;

        switch(addr) {

            case "multicall.lennczar.testnet":
                switch(func) {
                    case "withdraw_from_ref":
                        return <Family.Ref.Withdraw />
                }

            default:
                return <Family.BaseTask />

        }

    }

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
                        { this.getTaskType() }
                    </div>
                )}
            </Draggable>
        );

    }

}