import { DeleteOutline, EditOutlined, MoveDown, VisibilityOutlined, VisibilityOffOutlined } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import hash from 'object-hash';
import { Component } from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { Task } from '../components.js';
import { TextInput } from '../components/editor/elements';
import { ArgsAccount, ArgsError, ArgsString } from '../utils/args';
import { BatchCall } from '../utils/call';
import { STORAGE } from '../utils/persistent';
import './base.scss';
import './batch.scss';

export default class BatchTask extends Component {

    uniqueClassName="base-task";

    calls = new BatchCall();
    baseErrors = {
        addr: new ArgsError("Invalid address", value => ArgsAccount.isValid(value)),
        noSingleAddress: new ArgsError("Batches may only have one target address", value => this.errors.noSingleAddress)
    };
    errors = { ...this.baseErrors };
    options = {
        loaded: false,
        disguised: true,
        call: []
    };

    tasks = [];
    tasksDOM = [];

    get call() {

        this.calls.setCalls(this.getTasks().map(t => t.call));
        this.calls.name.value = this.options.call.name.value;
        this.calls.addr.value = this.options.call.addr.value;
        return this.calls;

    }

    constructor(props) {

        super(props);

        this.state = {
            showArgs: false,
            isEdited: false
        }

        this.options.call = {
            ...this.options.call,
            name: new ArgsString(""),
            addr: new ArgsAccount("")
        }

        if (window.TEMP) {

            this.state.showArgs = TEMP.showArgs;
            this.state.isEdited = TEMP.isEdited;
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
        
        if (!!this.props?.json)
            this.props.json.actions.map(a => ({
                address: this.props.json.address,
                actions: [a]            
            }))
                .forEach(j => {
                    const id = `task-${LAYOUT.taskID++}`;
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

        this.options.call = {
            ...this.options.call,
            name: new ArgsString(json?.name ?? "Batch"),
            addr: new ArgsAccount(json?.address ?? "")
        };

        this.loadErrors = (() => {
            this.errors.addr.validOrNull(this.options.call.addr);
        }).bind(this);

    }

    componentDidMount() {
        this.loadErrors?.();
        this.forceUpdate();
    }

    static inferOwnType(json) {
        return !!json && json.action.length > 1 
    }

    loadTasks() {

        const { addr } = this.options.call,
              { id } = this.props;

        // create tasks
        this.tasksDOM = STORAGE.layout.columns[id].taskIds
            .map(taskId => STORAGE.layout.tasks[taskId])
            .map((task, index) => <Task 
                    key={hash(task, { algorithm: 'md5', encoding: 'base64' })} 
                    task={task} 
                    index={index} 
                    json={task.json}
                />
            );

        // delete empty batches
        if (STORAGE.layout.columns[id].taskIds.length === 0 && this.options.loaded) {
            console.log("deleting empty batch");
            LAYOUT.deleteTask(id);
        }

        // evaluate errors
        this.tasks = this.tasksDOM.map(t => window.TASKS?.find(task => task.id === t.props.task.id)?.instance.current);
        if (this.tasks?.length >= 2 && this.tasks.every(t => !!t) && this.options.loaded)
            this.errors.noSingleAddress.isBad = !this.tasks.every(t => t.call.addr.value === addr.value);

        if (this.options.loaded && this.tasks.every(t => !!t))
            this.onTasksLoaded();

    }

    getTasks() {

        try {
            this.tasks = this.tasksDOM.map(t => TASKS.find(task => task.id === t.props.task.id).instance.current);
            return this.tasks;
        } catch(e) {
            throw new Error("Tasks not loaded");
        }

    }

    addNewTask(addr = "", func = "", json, callback) {

        const id = `task-${LAYOUT.taskID++}`;
        STORAGE.layout.columns[this.props.id].taskIds.push(id);
        STORAGE.layout.tasks[id] = { id: id, addr: addr, func: func, json: json }
        this.loadTasks();

        const eventHandler = (e) => {
            if (e.detail.task.id !== id) return;
            callback();
            document.removeEventListener('ontaskmounted', eventHandler);
        };
        document.addEventListener('ontaskmounted', eventHandler);

        this.forceUpdate();

        return id;

    }

    onAddressesUpdated() {}

    onTasksLoaded() {}

    onEditFocus(taskID) {

        this.setState({isEdited: taskID === this.props.id})

    }

    updateCard() {

        this.forceUpdate();
        EDITOR.forceUpdate();

    }

    displayTaskArgs(t) {

        // implementation in instance
        return null; 

    }

    renderEditor() {

        const {
            name,
            addr
        } = this.options.call;

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
            addr
        } = this.options.call;

        const { isEdited } = this.state;

        const { disguised } = this.options;

        const errors = this.errors;

        const { id } = this.props;

        this.loadTasks();

        const hasErrors = Object.entries(errors)
            .filter(([k, v]) => v.isBad)
            .length > 0

        return (
            <div 
                className={`task-container ${disguised ? "disguised-batch" + " " + this.uniqueClassName : "batch-container"} ${hasErrors ? "has-errors" : ""} ${isEdited ? "is-edited" : ""}`}
            >
                { disguised ? (
                    <>
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
                            <h3>{name.toString()}</h3>
                            <Tooltip title={<h1 style={{ fontSize: "12px" }}>Delete</h1>} disableInteractive >
                                <DeleteOutline
                                    className="delete icon"
                                    onClick={() => {
                                        LAYOUT.deleteTask(id);
                                    }}
                                />
                            </Tooltip>
                            <div className="delete-pseudo"></div>
                            <VisibilityOutlined
                                className="debug icon"
                                onClick={() => {
                                    this.options.disguised = false;
                                    this.forceUpdate();
                                }}
                            />
                            <div className="debug-pseudo"></div>
                        </div>
                        <div className="data-container">
                            <p><span>Contract address</span><a className="code" href={addr.toUrl()} target="_blank" rel="noopener noreferrer">{addr.toString()}</a></p>
                            <hr/>
                            { this.tasks.map(t => !!t && (
                                <div key={t.props.id}>
                                    <p className="expandable"><span>{t.call.name.value}</span>{
                                        t.state.showArgs
                                            ? <a onClick={() => t.setState({ showArgs: false }, () => this.forceUpdate())} >hide</a>
                                            : <a onClick={() => t.setState({ showArgs: true }, () => this.forceUpdate())} >show</a>
                                    }</p>
                                    {t.state.showArgs ? this.displayTaskArgs(t) : null}
                                </div>
                            )) }
                        </div>
                    </>
                ) : (
                    <>
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
                            <VisibilityOffOutlined
                                className="debug icon"
                                onClick={() => {
                                    this.options.disguised = true;
                                    this.forceUpdate();
                                }}
                            />
                            <div className="debug-pseudo"></div>
                        </div>
                    </>
                )}
                <div className={`test ${disguised ? "hidden" : ""}`}>
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
                                { this.tasksDOM }
                                { provided.placeholder }
                            </div>
                        ) }
                    </Droppable>
                </div>
            </div>
        )

    }

}