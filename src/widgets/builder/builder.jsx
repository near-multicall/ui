import React, { Component } from "react";
import { Droppable } from "react-beautiful-dnd";
import { Column } from "../column/column.jsx";
import "./builder.scss";

export class Builder extends Component {
    render() {
        const LAYOUT = this.props.layout; // ususally global parameter

        const menuColumn = LAYOUT.getColumns()["menu"];

        return (
            <Droppable
                droppableId="special"
                type="special"
            >
                {(provided) => (
                    <div
                        className="builder-container"
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                    >
                        <div className="selector">
                            <Column
                                key={"menu"}
                                column={menuColumn}
                                tasks={menuColumn.taskIds.map((taskId) => LAYOUT.getTasks()[taskId])}
                                index={LAYOUT.getColumnID()}
                            />
                        </div>
                    </div>
                )}
            </Droppable>
        );
    }
}
