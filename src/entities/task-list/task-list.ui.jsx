import Icon from "@mui/material/Icon";
import hash from "object-hash";
import { Component } from "react";
import { Draggable, Droppable } from "react-beautiful-dnd";

import { Task } from "../task/task.ui.jsx";
import "./task-list.ui.scss";

export class TaskList extends Component {
    render() {
        const menuColumn = this.props.column.id === "menu";

        return (
            <Draggable
                draggableId={this.props.column.id}
                index={this.props.index}
                {...this.props}
            >
                {(provided, snapshot) => (
                    <div
                        className="column-container"
                        showpseudo={snapshot.isDragging ? "no" : "yes"}
                        {...(!menuColumn ? provided.draggableProps : {})}
                        ref={provided.innerRef}
                    >
                        {!menuColumn ? (
                            <>
                                <Icon
                                    className="drag-handle"
                                    {...provided.dragHandleProps}
                                >
                                    drag_handle
                                </Icon>
                                <Icon
                                    className="delete-column"
                                    onClick={() => LAYOUT.deleteColumn(this.props.index)}
                                >
                                    delete_outline
                                </Icon>
                            </>
                        ) : (
                            <div
                                className="hidden"
                                {...provided.dragHandleProps}
                            ></div>
                        )}
                        <Droppable
                            droppableId={this.props.column.id}
                            type="task"
                        >
                            {(provided) => (
                                <div
                                    className="tasks-wrapper"
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                >
                                    {this.props.tasks.map(
                                        (task, index) =>
                                            (!menuColumn || this.props.show.includes(task.id)) && (
                                                <Task
                                                    key={hash(task, { algorithm: "md5", encoding: "base64" })}
                                                    task={task}
                                                    index={index}
                                                    json={task.json}
                                                />
                                            )
                                    )}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                        {!menuColumn && (
                            <Icon
                                className="add-column"
                                onClick={() => LAYOUT.addColumn()}
                            >
                                add
                            </Icon>
                        )}
                    </div>
                )}
            </Draggable>
        );
    }
}
