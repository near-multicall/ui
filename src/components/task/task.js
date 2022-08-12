import React, { Component } from 'react'
import { Draggable } from 'react-beautiful-dnd';
import { Family } from '../../components';
import hash from 'object-hash';
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

                COPY.payload = {
                    call: from.call,
                    showArgs: from.state.showArgs,
                    options: from.options,
                    errors: from.errors
                }
            
            }

        }

        const existent = window?.TASKS?.find(t => t.id === props.task.id);

        if (existent) {

            this.instance = existent.instance;
            this.child = existent.child;

            window.TEMP = {
                call: this.instance.current.call,
                showArgs: this.instance.current.state.showArgs,
                isEdited: this.instance.current.state.isEdited,
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

        document.dispatchEvent(new CustomEvent('ontaskmounted', {
            detail: {
                task: this
            }
        }))

    }

    componentWillUnmount() {

        const index = TASKS.indexOf(this);

        if (index === -1) return;

        TASKS.splice(index, 1);
        EDITOR.forceUpdate();

    }

    getTaskType() {

        const { addr, func } = this.state;
        const { json } = this.props;
        let newJson;

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

                        newJson = !!window.COPY
                            ? TASKS.find(t => t.id === window.COPY.from).instance.current.call.toJSON()
                            : json

                        console.log(newJson);

                        for (let family in Family) {
                            if (family === "BatchTask")
                                continue;
                            for (let task in Family[family])
                                if (Family[family][task].prototype instanceof Family.BatchTask && 
                                    Family[family][task].inferOwnType(newJson)) {
                                    const TaskComponent = Family[family][task];
                                    return <TaskComponent ref={this.instance} id={this.id} json={newJson}/>
                                }
                        }

                        return <Family.BatchTask ref={this.instance} id={this.id} json={newJson}/>

                    default:

                        newJson = !!window.COPY
                        ? TASKS.find(t => t.id === window.COPY.from).instance.current.call.toJSON()
                        : json

                        for (let family in Family) {
                            if (family === "BaseTask")
                                continue;
                            for (let task in Family[family])
                                if (Family[family][task].inferOwnType(newJson)) {
                                    const TaskComponent = Family[family][task];
                                    return <TaskComponent ref={this.instance} id={this.id} json={newJson}/>
                                }
                        }

                        return <Family.BaseTask ref={this.instance} id={this.id} json={json}/>

                }

        }

    }

    render() {

        return (
            <Draggable
                key={this.id}
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