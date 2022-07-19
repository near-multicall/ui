import { DeleteOutline, EditOutlined, MoveDown } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { Component } from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { Task } from '../components.js';
import { TextInput } from '../components/editor/elements';
import { ArgsAccount, ArgsError, ArgsString } from '../utils/args';
import { BatchCall } from '../utils/call';
import './base.scss';
import './batch.scss';

export default class BatchTask extends Component {

    calls = new BatchCall();
    options = {};
    errors = {
        addr: new ArgsError("Invalid address", value => ArgsAccount.isValid(value)),
        noSingleAddress: new ArgsError("Batches may only have one target address", value => this.errors.noSingleAddress)
    };

    tasks = [];
    tasksDOM = [];
    loaded = false;

    get call() {

        this.calls.setCalls(this.getTasks().map(t => t.call));
        return this.calls;

    }

    constructor(props) {

        super(props);

        this.state = {
            showArgs: false,
            isEdited: false,
            name: new ArgsString("Batch"),
            addr: new ArgsAccount(this.props?.json.actions[0].addr)
        }

        this.updateCard = this.updateCard.bind(this);

        this.loadErrors = (() => {
            this.errors.addr.validOrNull(this.state.addr);
            this.errors.noSingleAddress.isBad = !this.props.json.actions.every((a => a.addr === this.props.json.actions[0].addr))
        }).bind(this);

        document.addEventListener('onlayoutupdated', () => this.forceUpdate());

    }

    componentDidMount() {
        this.loadErrors?.();
        this.forceUpdate();
    }

    loadTasks() {

        console.log("BATCH loadTasks, TASKS:", ...TASKS.map(t => t.id));

        this.props.json.actions.map(a => ({
            address: this.props.json.address,
            actions: [a]            
        }))
            .forEach(j => {
                const id = `task-${LAYOUT.taskID++}`;
                const existent = TASKS.find(task => task.id === id);
                if (existent !== undefined && existent.instance.current !== null)
                    return;
                STORAGE.layout.columns[this.props.id].taskIds.push(id);
                STORAGE.layout.tasks[id] = { id: id, addr: "", func: "", json: j }
            })
        STORAGE.setLayout({}); // trigger callbacks

    }

    getTasks() {

        try {
            return this.tasksDOM.map(t => TASKS.find(task => task.id === t.key).instance.current);
        } catch(e) {
            throw new Error("Tasks not loaded");
        }
    }

    onListed() {

        if (window.TEMP !== null) // Batch is moved
            return;  

        console.log("BATCH onListed, TASKS:", ...TASKS.map(t => t.id));
        this.loadTasks();

        this.tasksDOM = STORAGE.layout.columns[this.props.id].taskIds
            .map(taskId => STORAGE.layout.tasks[taskId])
            .map((task, index) => <Task key={task.id} task={task} index={index} json={task.json}/>)

        this.loaded = true;
        this.forceUpdate();

    }

    onAddressesUpdated() {}

    onEditFocus(taskID) {

        this.setState({isEdited: taskID === this.props.id})

    }

    updateCard() {

        this.forceUpdate();
        EDITOR.forceUpdate();

    }

    renderEditor() {

        const {
            name,
            addr
        } = this.state;

        return (
            <div className="edit">
                <TextInput
                    value={name}
                    variant="standard"
                    margin="normal"
                    autoFocus
                    update={ this.updateCard }
                />
                <TextInput
                    label="Contract address"
                    value={addr}
                    error={this.errors.addr}
                    update={ this.updateCard }
                />
            </div>
        );

    }

    render() {

        const {
            name,
            isEdited
        } = this.state;

        const errors = this.errors;
        
        const hasErrors = Object.entries(errors)
            .filter(([k, v]) => v.isBad)
            .length > 0

        const { id } = this.props;

        this.tasksDOM = STORAGE.layout.columns[id].taskIds
            .map(taskId => STORAGE.layout.tasks[taskId])
            .map((task, index) => <Task key={task.id} task={task} index={index} json={task.json}/>);

        if (STORAGE.layout.columns[id].taskIds.length === 0 && this.loaded)
            LAYOUT.deleteTask(id);

        const tasks = this.tasksDOM.map(t => TASKS.find(task => task.id === t.key)?.instance.current);
        if (tasks?.length >= 2 && tasks.every(t => !!t) && this.loaded)
            errors.noSingleAddress.isBad = !tasks.every(t => t.call.addr.value === tasks[0].call.addr.value);

        return (
            <div
                className={`task-container batch-container ${this.uniqueClassName} ${hasErrors ? "has-errors" : ""} ${isEdited ? "is-edited" : ""}`}
            >
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
                    <h3>{name.value}</h3>
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
                    droppableId={id}
                    type="task"
                >
                    { provided => (
                        <div 
                            className="tasks-wrapper"
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                        >
                            { console.log("BATCH render, tasks", this.tasks) }
                            { this.tasksDOM }
                            { provided.placeholder }
                        </div>
                    ) }
                </Droppable>
            </div>
        )

    }

}