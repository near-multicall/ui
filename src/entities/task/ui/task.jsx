import React, { Component } from "react";
import { Draggable } from "react-beautiful-dnd";

import { Family } from "../../../families";
import "./task.scss";

/* TODO: Decompose model and view */
export class Task extends Component {
    id;

    constructor(props) {
        super(props);

        this.state = {
            addr: this.props.task.addr,
            func: this.props.task.func,
        };

        this.id = props.task.id;

        const original = window?.COPY?.to === props.task.id ? window?.COPY?.to : undefined;

        if (original) {
            const from = window?.TASKS?.find((t) => t.id === COPY.from)?.instance?.current;

            if (from) {
                COPY.payload = {
                    formData: from.state.formData,
                    showArgs: from.state.showArgs,
                    options: from.options,
                };
            }
        }

        const existent = window?.TASKS?.find((t) => t.id === props.task.id);

        if (existent) {
            this.instance = existent.instance;
            this.child = existent.child;

            window.TEMP = {
                formData: this.instance.current.state.formData,
                showArgs: this.instance.current.state.showArgs,
                isEdited: this.instance.current.state.isEdited,
                options: this.instance.current.options,
            };
        } else {
            this.instance = React.createRef();
            this.child = this.getTaskType();

            window.TEMP = null;
        }
    }

    componentDidMount() {
        if (window.TASKS) window.TASKS.push(this);
        else window.TASKS = [this];
    }

    componentWillUnmount() {
        const index = window.TASKS.indexOf(this);

        if (index === -1) return;

        window.TASKS.splice(index, 1);
        window.EDITOR.forceUpdate();
    }

    getTaskType() {
        const { addr, func } = this.state;
        const { json } = this.props;

        switch (addr) {
            case "multicall":
                switch (func) {
                    case "near_transfer":
                        return (
                            <Family.Multicall.Transfer
                                ref={this.instance}
                                id={this.id}
                                json={json}
                            />
                        );
                }

            case "near":
                switch (func) {
                    case "ft_transfer":
                        return (
                            <Family.Near.FtTransfer
                                ref={this.instance}
                                id={this.id}
                                json={json}
                            />
                        );
                    case "ft_transfer_call":
                        return (
                            <Family.Near.FtTransferCall
                                ref={this.instance}
                                id={this.id}
                                json={json}
                            />
                        );
                    case "mft_transfer":
                        return (
                            <Family.Near.MftTransfer
                                ref={this.instance}
                                id={this.id}
                                json={json}
                            />
                        );
                    case "mft_transfer_call":
                        return (
                            <Family.Near.MftTransferCall
                                ref={this.instance}
                                id={this.id}
                                json={json}
                            />
                        );
                    case "deposit_and_stake":
                        return (
                            <Family.Near.DepositAndStake
                                ref={this.instance}
                                id={this.id}
                                json={json}
                            />
                        );
                    case "unstake":
                        return (
                            <Family.Near.Unstake
                                ref={this.instance}
                                id={this.id}
                                json={json}
                            />
                        );
                    case "withdraw":
                        return (
                            <Family.Near.Withdraw
                                ref={this.instance}
                                id={this.id}
                                json={json}
                            />
                        );
                }

            default:
                for (let family in Family) {
                    if (family === "BaseTask") continue;
                    for (let task in Family[family])
                        if (Family[family][task].inferOwnType(json)) {
                            const TaskComponent = Family[family][task];
                            return (
                                <TaskComponent
                                    ref={this.instance}
                                    id={this.id}
                                    json={json}
                                />
                            );
                        }
                }

                return (
                    <Family.CustomTask
                        ref={this.instance}
                        id={this.id}
                        json={json}
                    />
                );
        }
    }

    render() {
        return (
            <Draggable
                draggableId={this.props.task.id}
                index={this.props.index}
            >
                {(provided, snapshot) => (
                    <div
                        className="task-wrapper"
                        ref={provided.innerRef}
                        {...provided.dragHandleProps}
                        {...provided.draggableProps}
                        style={{
                            ...provided.draggableProps.style,
                            zIndex: snapshot.isDragging ? 10 : 1,
                        }}
                    >
                        {/* <h1 style={{ paddingLeft: "20px" }}>{this.id}</h1> */}
                        {this.child}
                    </div>
                )}
            </Draggable>
        );
    }
}
