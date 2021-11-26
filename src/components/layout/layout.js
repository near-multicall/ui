import React, { Component } from 'react'
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { initialData } from '../../initial-data.js'
import { Column, Menu } from '../../components.js'
import './layout.scss'

export default class Layout extends Component {

    taskID = 0;
    columnID = 1;

    constructor(props) {

        super(props);
        
        this.state = initialData;

    }

    componentDidMount() {

        window.LAYOUT = this;

    }

    getTaskID = () => this.taskID;

    getColumnID = () => this.columnID;

    getTasks = () => this.state.tasks;

    getColumns = () => this.state.columns;

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

            // TODO: menu -> 0 -> menu doubs task.

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
                            <div className="empty-container"></div>
                        </div>
                    ) }
                </Droppable>
                <Menu layout={this}/>
            </DragDropContext>
        )

    }

}