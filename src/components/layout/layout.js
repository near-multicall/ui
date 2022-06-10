import React, { Component } from 'react'
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { initialData } from '../../initial-data.js'
import { Column, Menu } from '../../components.js'
import './layout.scss'
import Task from '../task/task.js';

export default class Layout extends Component {

    taskID = 0;
    columnID = 1;

    expanded = false;

    constructor(props) {

        super(props);
        
        this.state = {
            ...initialData,
        };

    }

    componentDidMount() {

        window.LAYOUT = this;

    }

    getTaskID = () => this.taskID;

    getColumnID = () => this.columnID;

    getTasks = () => this.state.tasks;

    getColumns = () => this.state.columns;

    // TODO delete elements after exjecting from tasklist / columnlist

    deleteTask = (taskId) => {

        let column, index;

        for (let c of this.state.columnOrder)
            for (let i in this.state.columns[c].taskIds)
                if (this.state.columns[c].taskIds[i] === taskId) {
                    column = this.state.columns[c];
                    index = i
                }

        if (column == undefined || index == undefined) {
            console.error("Task not found");
            return;
        }

        const taskIds = Array.from(column.taskIds);
        taskIds.splice(index, 1);
        const newColumn = {
            ...column,
            taskIds: taskIds
        };

        const newState = {
            ...this.state,
            columns: {
                ...this.state.columns,
                [newColumn.id]: newColumn,
            }
        }

        this.setState(newState);

    }

    duplicateTask = (taskId) => {

        let column, index;

        for (let c of this.state.columnOrder)
            for (let i in this.state.columns[c].taskIds)
                if (this.state.columns[c].taskIds[i] === taskId) {
                    column = this.state.columns[c];
                    index = i
                }

        if (column == undefined || index == undefined) {
            console.error("Task not found");
            return;
        }

        // create new task
        const taskClone = JSON.parse(JSON.stringify(this.state.tasks[taskId.toString()]));
        taskClone.id = `task-${this.taskID}`;
        this.state.tasks[taskClone.id] = taskClone;

        const taskIds = Array.from(column.taskIds);
        taskIds.splice(index, 0, `task-${this.taskID}`);

        this.taskID++;

        const newColumn = {
            ...column,
            taskIds: taskIds
        };

        const newState = {
            ...this.state,
            columns: {
                ...this.state.columns,
                [newColumn.id]: newColumn,
            }
        }

        window.COPY = {
            from: taskId,
            to: taskClone.id
        }
        this.setState(newState);

    }

    clear = () => {

        let newState = {
            ...initialData
        }

        this.taskID = 0;
        this.columnID = 1;

        this.setState(newState);

    }

    deleteColumn = index => {

        const newColumnOrder = Array.from(this.state.columnOrder);
        newColumnOrder.splice(index, 1);

        let newState = {
            ...this.state,
            columnOrder: newColumnOrder
        }

        // list should never be empty
        if (newColumnOrder.length === 0)
            newState = {
                ...this.state,
                columns: {
                    ...this.state.columns,
                    [`column-${this.columnID}`]: {
                        id: `column-${this.columnID}`,
                        title: 'Drag here',
                        taskIds: []
                    }
                },
                columnOrder: [`column-${this.columnID++}`]
            }

        this.setState(newState);

    }

    addColumn = () => {

        const newColumn = {
            id: `column-${this.columnID}`,
            title: 'Drag here',
            taskIds: []
        };

        const newColumnOrder = Array.from(this.state.columnOrder);
        newColumnOrder.push(`column-${this.columnID}`);

        const newState = {
            ...this.state,
            columns: {
                ...this.state.columns,
                [`column-${this.columnID}`]: newColumn
            },
            columnOrder: newColumnOrder
        }

        this.columnID++;

        this.setState(newState);

    }

    onDragEnd = result => {

        const { destination, source, draggableId, type } = result;
    
        if (!destination)
            return;

        if (destination.droppableId === source.droppableId &&
            destination.index === source.index)
            return;

        if (type === 'column') {
            
            const newColumnOrder = Array.from(this.state.columnOrder);

            newColumnOrder.splice(source.index, 1);
            newColumnOrder.splice(destination.index, 0, draggableId);

            const newState = {
                ...this.state,
                columnOrder: newColumnOrder
            };

            this.setState(newState);

            return;

        }

        const start = this.state.columns[source.droppableId];
        const finish = this.state.columns[destination.droppableId];

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
                taskIds: newTaskIds
            };

            const newState = {
                ...this.state,
                columns: {
                    ...this.state.columns,
                    [newColumn.id]: newColumn
                }
            }

            this.setState(newState);

        } else {

            let newStart;

            if (finish.id === 'menu')
                return;

            if (start.id === 'menu') {

                const startTaskIds = Array.from(start.taskIds);

                // change taskId
                const taskId = startTaskIds[source.index];
                startTaskIds[source.index] = `task-${this.taskID}`;

                // create new task
                const taskClone = JSON.parse(JSON.stringify(this.state.tasks[taskId.toString()]));
                taskClone.id = `task-${this.taskID}`;
                this.state.tasks[taskClone.id] = taskClone;

                this.taskID++;

                newStart = {
                    ...start,
                    taskIds: startTaskIds
                };

            } else {

                const startTaskIds = Array.from(start.taskIds);
                startTaskIds.splice(source.index, 1);
                newStart = {
                    ...start,
                    taskIds: startTaskIds
                };

            }

            if (finish.id === 'trash') {

                const newState = {
                    ...this.state,
                    columns: {
                        ...this.state.columns,
                        [newStart.id]: newStart,
                    }
                }
    
                this.setState(newState);

                return;

            }

            const finishTaskIds = Array.from(finish.taskIds);
            finishTaskIds.splice(destination.index, 0, draggableId);
            const newFinish = {
                ...finish,
                taskIds: finishTaskIds
            };

            const newState = {
                ...this.state,
                columns: {
                    ...this.state.columns,
                    [newStart.id]: newStart,
                    [newFinish.id]: newFinish
                }
            }

            this.setState(newState);

        }

    }

    fromJSON(json) {

        this.clear();

        this.columnID = 0;

        let newState = {
            ...this.state,
            columnOrder: [],
            columns: {
                "trash": this.state.columns.trash,
                "menu": this.state.columns.menu,
            }
        }

        for (let c in json) {

            const newColumn = {
                id: `column-${this.columnID}`,
                title: 'Drag here',
                taskIds: []
            };
    
            const newColumnOrder = Array.from(newState.columnOrder);
            newColumnOrder.push(`column-${this.columnID}`);
    
            newState = {
                ...newState,
                columns: {
                    ...newState.columns,
                    [`column-${this.columnID}`]: newColumn
                },
                columnOrder: newColumnOrder
            }
    
            this.columnID++;
            
            for (let t in json[c]) {
                let task = {id: `task-${this.taskID++}`, addr: "", func: "", json: json[c][t]};
                newState.columns[newColumn.id].taskIds.push(task.id);
                newState.tasks[task.id] = task;
            }
        }

        this.setState(newState, () => TASKS.forEach(t => t.instance.current.forceUpdate()));

    }

    toJSON() {

        let output = [];

        for (let c of this.state.columnOrder) {
        
            if (this.state.columns[c].taskIds.length === 0)
                continue;
            output.push([]);
            for (let t of this.state.columns[c].taskIds) {
                const task = TASKS.find(task => task.id === t);
                if (task)
                    output[output.length -1].push(task.instance.current.call.toJSON());
                else
                    console.warn(`no task with id ${t}`);
            }
        
        }

        return output;

    }

    toBase64() {

        let output = [];

        for (let c of this.state.columnOrder) {
        
            if (this.state.columns[c].taskIds.length === 0)
                continue;
            output.push([]);
            for (let t of this.state.columns[c].taskIds) {
                const task = TASKS.find(task => task.id === t);
                if (task)
                    output[output.length -1].push(task.instance.current.call.toBase64());
                else
                    console.warn(`no task with id ${t}`);
            }
        
        }

        return output;

    }

    toErrors() {

        let output = [];

        if (!window?.TASKS)
            return output;

        const tasks = TASKS
            .filter(t => !this.state.columns['menu'].taskIds.includes(t.id))
            .map(t => t.instance.current);

        for (let t of tasks)
            for (let e in t.errors)
                if (t.errors[e].isBad)
                    output.push({
                        task: t,
                        message: t.errors[e].message
                    });

        return output;

    }

    export() {

        return JSON.stringify({
            schedules: this.toBase64()
        });

    }

    empty() {

        return this.state.columnOrder.length === 1 && this.state.columns[this.state.columnOrder[0]].taskIds.length === 0

    }

    setExpanded(expanded) {

        this.expanded = expanded;
        this.forceUpdate();
        SIDEBAR.forceUpdate();

    }

    render() {

        return (
            <DragDropContext
                onDragEnd={this.onDragEnd}
            >
                <Droppable
                    droppableId="layout"
                    direction="horizontal"
                    type="column"
                >
                    { provided => (
                        <div className="layout-wrapper">
                            <div 
                                className="layout-container"
                                tutorial={ this.empty()
                                    ? "yes"
                                    : "no"
                                }
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                            >
                                { this.state.columnOrder.map((columnId, index) => {
                                
                                    const column = this.state.columns[columnId];
                                    const tasks = column.taskIds.map(taskId => this.state.tasks[taskId]);

                                    return (
                                        <Column 
                                            key={column.id} 
                                            column={column} 
                                            tasks={tasks} 
                                            index={index} 
                                        />
                                    )

                                }) }
                                { provided.placeholder }
                            </div>
                            <div className={`empty-container ${this.expanded ? "expanded-empty" : ""}`}></div>
                        </div>
                    ) }
                </Droppable>
                <Menu layout={this}/>
            </DragDropContext>
        )

    }

}