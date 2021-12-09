import React, { Component } from 'react'
import { Draggable } from 'react-beautiful-dnd';
import { Family } from '../../components';
import './task.scss'

export default class Task extends Component {

    id;

    constructor(props) {

        super(props);

        this.state = {
            addr: this.props.task.addr,
            func: this.props.task.func,
        };

        this.instance = React.createRef();
        this.id = props.task.id;

    }

    componentDidMount() {

        if (window.TASKS)
            window.TASKS.push(this);
        else 
            window.TASKS = [this];

    }

    componentWillUnmount() {

        TASKS.splice(TASKS.indexOf(this), 1);

    }

    getTaskType() {

        const { addr, func } = this.state;

        switch(addr) {

            case "multicall.lennczar.testnet":
                switch(func) {
                    case "withdraw_from_ref":
                        return <Family.Ref.Withdraw ref={this.instance}/>
                }

            default:
                return <Family.BaseTask ref={this.instance}/>

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