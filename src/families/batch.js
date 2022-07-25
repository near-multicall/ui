import { DeleteOutline, EditOutlined, MoveDown, VisibilityOutlined, VisibilityOffOutlined } from '@mui/icons-material';
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

    uniqueClassName="base-task";

    calls = new BatchCall();
    baseErrors = {
        addr: new ArgsError("Invalid address", value => ArgsAccount.isValid(value)),
        noSingleAddress: new ArgsError("Batches may only have one target address", value => this.errors.noSingleAddress)
    };
    errors = { ...this.baseErrors };
    options = {
        loaded: false,
        disguised: true
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
        this.tasks = this.tasksDOM.map(t => TASKS.find(task => task.id === t.props.task.id)?.instance.current);
        if (this.tasks?.length >= 2 && this.tasks.every(t => !!t) && this.options.loaded)
            this.errors.noSingleAddress.isBad = !this.tasks.every(t => t.call.addr.value === addr.value);

    }

    getTasks() {

        try {
            this.tasks = this.tasksDOM.map(t => TASKS.find(task => task.id === t.props.task.id).instance.current);
            return this.tasks;
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

    // TODO move this to instance
    displayTaskArgs(t) {

        const args = t.call.args.value;
        const func = t.call.func.value;

        switch (func) {
            case "ft_transfer": return (
                <div className="details">
                    <p><span>Receiver</span><span className="code">{args.receiver_id?.value}</span></p>
                    <p><span>Amount</span><span className="code">{args.amount?.value}</span></p>
                    <p><span>Memo</span><span className="code">{args.memo?.value}</span></p>
                </div>
            )
            case "storage_deposit": return (
                <div className="details">
                    <p><span>Account</span><span className="code">{args.account_id?.value}</span></p>
                </div>
            )
            default: return null
        }

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
            addr,
            isEdited
        } = this.state;

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