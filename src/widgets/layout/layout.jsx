import React, { Component } from "react";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import { Column } from "../column/column.jsx";
import { Menu } from "../menu/menu.jsx";
import { initialData } from "../../initial-data.js";
import { Base64 } from "js-base64";
import { STORAGE } from "../../shared/lib/persistent";
import "./layout.scss";

export class Layout extends Component {
    taskID = 0;
    columnID = 1;

    expanded = false;

    constructor(props) {
        super(props);

        this.clear();

        document.addEventListener("onlayoutupdated", () => this.forceUpdate());
    }

    componentDidMount() {
        window.LAYOUT = this;
        STORAGE.load();
    }

    getTaskID = () => this.taskID;

    getColumnID = () => this.columnID;

    getTasks = () => STORAGE.layout.tasks;

    getColumns = () => STORAGE.layout.columns;

    // TODO delete elements after exjecting from tasklist / columnlist

    /**
     * returns column ID and index inside column's taskIds for a given taskId
     *
     * @param {string} taskId
     * @returns {object}
     */
    static findTaskCoordinates = (taskId) => {
        let index;
        const layout = STORAGE.layout;
        const colId = layout.columnOrder.find((colId) => {
            index = layout.columns[colId].taskIds.indexOf(taskId);
            return index >= 0;
        });

        return { columnId: colId, taskIndex: index };
    };

    deleteTask = (taskId) => {
        const layout = STORAGE.layout;
        const { columnId, taskIndex } = Layout.findTaskCoordinates(taskId);

        if (columnId == undefined || taskIndex == undefined) {
            console.error("Task not found");
            return;
        }

        const column = layout.columns[columnId];
        const taskIds = Array.from(column.taskIds);
        taskIds.splice(taskIndex, 1);
        const newColumn = {
            ...column,
            taskIds: taskIds,
        };

        const newLayout = {
            ...layout,
            columns: {
                ...layout.columns,
                [columnId]: newColumn,
            },
        };

        STORAGE.setLayout(newLayout);
    };

    duplicateTask = (taskId) => {
        const layout = STORAGE.layout;
        const { columnId, taskIndex } = Layout.findTaskCoordinates(taskId);

        if (columnId == undefined || taskIndex == undefined) {
            console.error("Task not found");
            return;
        }

        // create new task
        const taskClone = JSON.parse(JSON.stringify(layout.tasks[taskId.toString()]));
        taskClone.id = `task-${this.taskID}`;

        const column = layout.columns[columnId];
        const taskIds = Array.from(column.taskIds);
        taskIds.splice(taskIndex, 0, taskClone.id);

        this.taskID++;

        const newColumn = {
            ...column,
            taskIds: taskIds,
        };

        const newLayout = {
            ...layout,
            columns: {
                ...layout.columns,
                [columnId]: newColumn,
            },
            tasks: {
                ...layout.tasks,
                [taskClone.id]: taskClone,
            },
        };

        window.COPY = {
            from: taskId,
            to: taskClone.id,
        };

        STORAGE.setLayout(newLayout);
    };

    clear = () => {
        console.warn("layout cleared");

        // clear card content
        if (window.TASKS) window.TASKS = [];

        this.taskID = 0;
        this.columnID = 1;

        STORAGE.setLayout(initialData);
    };

    deleteColumn = (index) => {
        const layout = STORAGE.layout;
        const newColumnOrder = Array.from(layout.columnOrder);
        newColumnOrder.splice(index, 1);

        let newLayout = {
            ...layout,
            columnOrder: newColumnOrder,
        };

        // list should never be empty
        if (newColumnOrder.length === 0)
            newLayout = {
                ...layout,
                columns: {
                    ...layout.columns,
                    [`column-${this.columnID}`]: {
                        id: `column-${this.columnID}`,
                        title: "Drag here",
                        taskIds: [],
                    },
                },
                columnOrder: [`column-${this.columnID++}`],
            };

        STORAGE.setLayout(newLayout);
    };

    addColumn = () => {
        const newColumn = {
            id: `column-${this.columnID}`,
            title: "Drag here",
            taskIds: [],
        };

        const layout = STORAGE.layout;
        const newColumnOrder = Array.from(layout.columnOrder);
        newColumnOrder.push(`column-${this.columnID}`);

        const newLayout = {
            ...layout,
            columns: {
                ...layout.columns,
                [`column-${this.columnID}`]: newColumn,
            },
            columnOrder: newColumnOrder,
        };

        this.columnID++;

        STORAGE.setLayout(newLayout);
    };

    onDragEnd = (result) => {
        const layout = STORAGE.layout;
        const { destination, source, draggableId, type } = result;

        if (!destination) return;

        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        if (type === "column") {
            const newColumnOrder = Array.from(layout.columnOrder);

            newColumnOrder.splice(source.index, 1);
            newColumnOrder.splice(destination.index, 0, draggableId);

            const newLayout = {
                ...layout,
                columnOrder: newColumnOrder,
            };

            STORAGE.setLayout(newLayout);

            return;
        }

        const start = layout.columns[source.droppableId];
        const finish = layout.columns[destination.droppableId];

        if (!start || !finish) {
            console.warn(`Something went wrong when dragging from ${start} to ${finish}`);
            return;
        }

        if (start === finish) {
            const newTaskIds = Array.from(start.taskIds);

            newTaskIds.splice(source.index, 1);
            newTaskIds.splice(destination.index, 0, draggableId);

            const newColumn = {
                ...start,
                taskIds: newTaskIds,
            };

            const newLayout = {
                ...layout,
                columns: {
                    ...layout.columns,
                    [newColumn.id]: newColumn,
                },
            };

            STORAGE.setLayout(newLayout);
        } else {
            let newStart;

            if (finish.id === "menu") return;

            if (start.id === "menu") {
                const startTaskIds = Array.from(start.taskIds);

                // change taskId
                const taskId = startTaskIds[source.index];
                startTaskIds[source.index] = `task-${this.taskID}`;

                // create new task
                const taskClone = JSON.parse(JSON.stringify(layout.tasks[taskId.toString()]));
                taskClone.id = `task-${this.taskID}`;
                STORAGE.layout.tasks[taskClone.id] = taskClone;

                this.taskID++;

                newStart = {
                    ...start,
                    taskIds: startTaskIds,
                };
            } else {
                const startTaskIds = Array.from(start.taskIds);
                startTaskIds.splice(source.index, 1);
                newStart = {
                    ...start,
                    taskIds: startTaskIds,
                };
            }

            const finishTaskIds = Array.from(finish.taskIds);
            finishTaskIds.splice(destination.index, 0, draggableId);
            const newFinish = {
                ...finish,
                taskIds: finishTaskIds,
            };

            const newLayout = {
                ...layout,
                columns: {
                    ...layout.columns,
                    [newStart.id]: newStart,
                    [newFinish.id]: newFinish,
                },
            };

            STORAGE.setLayout(newLayout);
        }
    };

    fromJSON(json) {
        this.clear();

        const layout = STORAGE.layout;

        if (!Array.isArray(json) || !json.length) return;

        this.columnID = 0;

        let newLayout = {
            ...layout,
            columnOrder: [],
            columns: {
                menu: layout.columns.menu,
            },
        };

        for (let c in json) {
            const newColumn = {
                id: `column-${this.columnID}`,
                title: "Drag here",
                taskIds: [],
            };

            const newColumnOrder = Array.from(newLayout.columnOrder);
            newColumnOrder.push(`column-${this.columnID}`);

            newLayout = {
                ...newLayout,
                columns: {
                    ...newLayout.columns,
                    [`column-${this.columnID}`]: newColumn,
                },
                columnOrder: newColumnOrder,
            };

            this.columnID++;

            for (let t in json[c]) {
                let task = { id: `task-${this.taskID++}`, addr: "", func: "", json: json[c][t] };
                newLayout.columns[newColumn.id].taskIds.push(task.id);
                newLayout.tasks[task.id] = task;
            }
        }

        STORAGE.setLayout(newLayout);
    }

    fromBase64(json) {
        this.clear();

        const layout = STORAGE.layout;

        if (!Array.isArray(json) || !json.length) return;

        this.columnID = 0;

        let newLayout = {
            ...layout,
            columnOrder: [],
            columns: {
                menu: layout.columns.menu,
            },
        };

        for (let c in json) {
            const newColumn = {
                id: `column-${this.columnID}`,
                title: "Drag here",
                taskIds: [],
            };

            const newColumnOrder = Array.from(newLayout.columnOrder);
            newColumnOrder.push(`column-${this.columnID}`);

            newLayout = {
                ...newLayout,
                columns: {
                    ...newLayout.columns,
                    [`column-${this.columnID}`]: newColumn,
                },
                columnOrder: newColumnOrder,
            };

            this.columnID++;

            for (let t in json[c]) {
                const { address: jsonAddress, actions: jsonActions } = json[c][t];
                let task = {
                    id: `task-${this.taskID++}`,
                    addr: "",
                    func: "",
                    json: {
                        address: jsonAddress,
                        actions: jsonActions.map((action) => ({
                            func: action.func,
                            args: JSON.parse(Base64.decode(action.args)),
                            gas: action.gas,
                            depo: action.depo,
                        })),
                    },
                };
                newLayout.columns[newColumn.id].taskIds.push(task.id);
                newLayout.tasks[task.id] = task;
            }
        }

        STORAGE.setLayout(newLayout);
    }

    toJSON() {
        const layout = STORAGE.layout;
        let output = [];

        for (let c of layout.columnOrder) {
            if (layout.columns[c].taskIds.length === 0) continue;
            output.push([]);
            for (let t of layout.columns[c].taskIds) {
                const task = TASKS.find((task) => task.id === t);
                if (task) output[output.length - 1].push(task.instance.current.call.toJSON());
                else console.warn(`no task with id ${t}`);
            }
        }

        return output;
    }

    toBase64() {
        const layout = STORAGE.layout;
        let output = [];

        for (let c of layout.columnOrder) {
            if (layout.columns[c].taskIds.length === 0) continue;
            output.push([]);
            for (let t of layout.columns[c].taskIds) {
                const task = TASKS.find((task) => task.id === t);
                if (task) output[output.length - 1].push(task.instance.current.call.toBase64());
                else console.warn(`no task with id ${t}`);
            }
        }

        return output;
    }

    toErrors() {
        const layout = STORAGE.layout;
        let output = [];

        if (!window?.TASKS) return output;

        const tasks = TASKS.filter((t) => !layout.columns["menu"].taskIds.includes(t.id)).map(
            (t) => t.instance.current
        );

        for (let t of tasks)
            for (let e in t.errors)
                if (t.errors[e].isBad)
                    output.push({
                        task: t,
                        message: t.errors[e].message,
                    });

        return output;
    }

    export() {
        return JSON.stringify({
            schedules: this.toBase64(),
        });
    }

    empty() {
        const layout = STORAGE.layout;
        return layout.columnOrder.length === 1 && layout.columns[layout.columnOrder[0]].taskIds.length === 0;
    }

    setExpanded(expanded) {
        this.expanded = expanded;
        this.forceUpdate();
        SIDEBAR.forceUpdate();
    }

    render() {
        const layout = STORAGE.layout;

        return (
            <DragDropContext onDragEnd={this.onDragEnd}>
                <Droppable
                    droppableId="layout"
                    direction="horizontal"
                    type="column"
                >
                    {(provided) => (
                        <div className="layout-wrapper">
                            <div
                                className="layout-container"
                                tutorial={this.empty() ? "yes" : "no"}
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                            >
                                {layout.columnOrder.map((columnId, index) => {
                                    const column = layout.columns[columnId];
                                    const tasks = column.taskIds.map((taskId) => layout.tasks[taskId]);

                                    return (
                                        <Column
                                            key={column.id}
                                            column={column}
                                            tasks={tasks}
                                            index={index}
                                        />
                                    );
                                })}
                                {provided.placeholder}
                            </div>
                            <div className={`empty-container ${this.expanded ? "expanded-empty" : ""}`}></div>
                        </div>
                    )}
                </Droppable>
                <Menu layout={this} />
            </DragDropContext>
        );
    }
}
