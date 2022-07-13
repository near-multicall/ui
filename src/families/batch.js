import React, { Component } from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { DeleteOutline, MoveDown, EditOutlined } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { Task } from '../components.js'
import { BatchCall } from '../utils/call';
import './batch.scss';
import './base.scss';

export default class BatchTask extends Component {

    calls = new BatchCall();
    options = {};
    errors;

    tasks;

    get call() {

        this.calls.setCalls(this.tasks.map(t => TASKS.find(task => task.id === t.id).instance.current.call));
        return this.calls;

    }

    constructor(props) {

        super(props);

        this.state = {
            showArgs: false
        }

        document.addEventListener('onlayoutupdated', () => this.forceUpdate())

    }

    componentDidMount() {

        console.log("IAM FUCKING MOUNTING");
        this.loadTasks();

    }

    loadTasks() {

        this.props.json.actions.map(a => ({
            address: this.props.json.address,
            actions: [a]            
        }))
            .forEach((j, i) => {
                if (TASKS.find(task => task.id === `${this.props.id}-${i}`)) {
                    console.log(`${this.props.id}-${i}`, "already exists!!!", TASKS.find(task => task.id === `${this.props.id}-${i}`));
                }
                console.log("I am now spawning new task", `${this.props.id}-${i}`, "eventhough this exists:", TASKS.find(task => task.id === `${this.props.id}-${i}`))
                STORAGE.layout.columns[this.props.id].taskIds.push(`${this.props.id}-${i}`);
                STORAGE.layout.tasks[`${this.props.id}-${i}`] = { id: `${this.props.id}-${i}`, addr: "", func: "", json: j }
            })
        STORAGE.setLayout({}); // trigger callbacks

        console.log("loaded");

    }

    onAddressesUpdated() {}

    render() {

        this.tasks = STORAGE.layout.columns[this.props.id].taskIds.map(taskId => STORAGE.layout.tasks[taskId]);

        console.log(this.tasks);

        return (
            <div className="task-container batch-container">
                <div className="name">
                    <Tooltip title={<h1 style={{ fontSize: "12px" }}>Edit</h1>} disableInteractive >
                        <EditOutlined
                            className="edit icon"
                            onClick={() => {
                                EDITOR.edit(id);
                                MENU.changeTab(1);
                            }}
                        />
                    </Tooltip>
                    <div className="edit-pseudo"></div>
                    <Tooltip title={<h1 style={{ fontSize: "12px" }}>Clone card</h1>} disableInteractive >
                        <MoveDown
                            className="duplicate icon"
                            onClick={() => {
                                LAYOUT.duplicateTask(id);
                            }}
                        />
                    </Tooltip>
                    <div className="duplicate-pseudo"></div>
                    <h3>Batch</h3>
                    <Tooltip title={<h1 style={{ fontSize: "12px" }}>Delete</h1>} disableInteractive >
                        <DeleteOutline
                            className="delete icon"
                            onClick={() => {
                                LAYOUT.deleteTask(id);
                            }}
                        />
                    </Tooltip>
                    <div className="delete-pseudo"></div>
                </div>
                <Droppable 
                    droppableId={this.props.id}
                    type="task"
                >
                    { provided => (
                        <div 
                            className="tasks-wrapper"
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                        >
                            { this.tasks.map((task, index) => <Task key={task.id} task={task} index={index} json={task.json}/>) }
                            { provided.placeholder }
                        </div>
                    ) }
                </Droppable>
            </div>
        )

    }

}