import { DeleteOutline, EditOutlined, MoveDown } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import hash from 'object-hash';
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
    errors = {
        addr: new ArgsError("Invalid address", value => ArgsAccount.isValid(value)),
        noSingleAddress: new ArgsError("Batches may only have one target address", value => this.errors.noSingleAddress)
    };
    options = {
        loaded: false
    };

    tasks = [];
    tasksDOM = [];

    get call() {

        this.calls.setCalls(this.getTasks().map(t => t.call));
        this.calls.name.value = this.state.name.value;
        this.calls.addr.value = this.state.addr.value;
        return this.calls;

    }

    constructor(props) {

        super(props);

        this.state = {
            showArgs: false,
            isEdited: false,
            name: new ArgsString(""),
            addr: new ArgsAccount("")
        }

        if (window.TEMP) {

            this.state.name.value = TEMP.call.name.value;
            this.state.addr.value = TEMP.call.addr.value;
            this.state.showArgs = TEMP.showArgs;
            this.options = TEMP.options;
            this.errors = TEMP.errors;

        } else if (window.COPY?.payload) {

            const optionsDeepCopy = JSON.parse(JSON.stringify(COPY.payload.options))

            this.init({
                name: COPY.payload.call?.name?.toString(),
                ...COPY.payload.call.toJSON(),
                options: optionsDeepCopy
            })
            this.state.showArgs = COPY.payload.showArgs;
            COPY = null;

            this.options.loaded = false;

        } else {
            this.init(this.props.json);
        }

        if (window.TEMP !== null) // Batch is moved
            return; 
        
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

        this.loadTasks();

        this.options.loaded = true;

        this.updateCard = this.updateCard.bind(this);

        document.addEventListener('onlayoutupdated', () => this.forceUpdate());

    }

    init(json = null) {

        this.state = {
            ...this.state,
            name: new ArgsString(json?.name ?? "Batch"),
            addr: new ArgsAccount(json?.address ?? "")
        };

        this.loadErrors = (() => {
            this.errors.addr.validOrNull(this.state.addr);
        }).bind(this);

    }

    componentDidMount() {
        this.loadErrors?.();
        this.forceUpdate();
    }

    loadTasks() {

        const { addr } = this.state,
              { id } = this.props;

        // create tasks
        this.tasksDOM = STORAGE.layout.columns[id].taskIds
            .map(taskId => STORAGE.layout.tasks[taskId])
            .map((task, index) => 
                <Task 
                    key={hash(task, { algorithm: 'md5', encoding: 'base64' })} 
                    task={task} 
                    index={index} 
                    json={task.json}
                />
            );

        // delete empty batches
        if (STORAGE.layout.columns[id].taskIds.length === 0 && this.options.loaded)
            LAYOUT.deleteTask(id);

        // evaluate errors
        const tasks = this.tasksDOM.map(t => TASKS.find(task => task.id === t.props.task.id)?.instance.current);
        if (tasks?.length >= 2 && tasks.every(t => !!t) && this.options.loaded)
            this.errors.noSingleAddress.isBad = !tasks.every(t => t.call.addr.value === addr.value);

    }

    getTasks() {

        try {
            return this.tasksDOM.map(t => TASKS.find(task => task.id === t.props.task.id).instance.current);
        } catch(e) {
            throw new Error("Tasks not loaded");
        }

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

        const { id } = this.props;

        this.loadTasks();

        const hasErrors = Object.entries(errors)
            .filter(([k, v]) => v.isBad)
            .length > 0

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
                            { console.log("BATCH render, tasks", this.tasksDOM) }
                            { this.tasksDOM }
                            { provided.placeholder }
                        </div>
                    ) }
                </Droppable>
            </div>
        )

    }

}