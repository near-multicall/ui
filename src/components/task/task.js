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
            func: this.props.task.func
        };

        this.id = props.task.id;

        const original = window?.COPY?.to === props.task.id ? window?.COPY?.to : undefined;

        if (original) {

            const from = window?.TASKS?.find(t => t.id === COPY.from)?.instance?.current;

            if (from) {

                COPY["payload"] = {
                    call: from.call,
                    showArgs: from.state.showArgs,
                    options: from.options,
                    errors: from.errors
                }
            
            }

        } else { 

            window.COPY = null;

        }

        const existent = window?.TASKS?.find(t => t.id === props.task.id);

        if (existent) {

            this.instance = existent.instance;
            this.child = existent.child;

            window.TEMP = {
                call: this.instance.current.call,
                showArgs: this.instance.current.state.showArgs,
                options: this.instance.current.options,
                errors: this.instance.current.errors
            };

        } else {

            this.instance = React.createRef();
            this.child = this.getTaskType();

            window.TEMP = null;

        }

    }

    componentDidMount() {

        if (window.TASKS)
            window.TASKS.push(this);
        else 
            window.TASKS = [this];

    }

    componentWillUnmount() {

        TASKS.splice(TASKS.indexOf(this), 1);
        EDITOR.forceUpdate();

    }

    getTaskType() {

        const { addr, func } = this.state;
        const { json } = this.props;

        switch(addr) {

            case "multicall":
                switch(func) {
                    case "withdraw_from_ref":
                        return <Family.Ref.Withdraw ref={this.instance} id={this.id} json={json}/>
                    case "near_transfer":
                        return <Family.Multicall.Transfer ref={this.instance} id={this.id} json={json}/>
                }

            case "near":
                switch (func) {
                    case "ft_transfer":
                        return <Family.Near.Transfer ref={this.instance} id={this.id} json={json}/>        
                    case "storage_deposit":
                        return <Family.Near.StorageDeposit ref={this.instance} id={this.id} json={json}/>        
                }

            case "ref-finance":
                switch (func) {
                    case "swap":
                        return <Family.Ref.Swap ref={this.instance} id={this.id} json={json}/>        
                }

            default:
                switch (func) {
                    case "batch":
                        return <Family.BatchTask ref={this.instance} id={this.id} json={json}/>
                    default:
                        return <Family.BaseTask ref={this.instance} id={this.id} json={json}/>
                }

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
                        {/* <h1 style={{paddingLeft: "20px"}}>{this.id}</h1> */}
                        { this.child }
                    </div>
                )}
            </Draggable>
        );

    }

}