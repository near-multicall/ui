import { Icon, InputAdornment } from '@mui/material';
import Checkbox from '@mui/material/Checkbox';
import debounce from "lodash.debounce";
import React from 'react';
import { TextInput } from '../../components/editor/elements';
import { ArgsAccount, ArgsError, ArgsString } from "../../utils/args";
import { view } from "../../utils/wallet";
import BatchTask from '../batch';
import "./near.scss";
import StorageDeposit from './storage-deposit';
import Transfer from './transfer';

export default class Transfer_Batch extends BatchTask {

    uniqueClassName = "near-transfer-task";
    errors = {
        ...this.baseErrors,
        noToken: new ArgsError("Address does not belong to token contract", value => this.errors.noToken)
    };

    targets = {};
    sdOffset = 0;

    updateFTDebounced = debounce(() => this.updateFT(), 500);
    updateSDDebounced = debounce((target) => this.updateSD(target), 500);

    constructor(props) {

        super(props);

        this.updateFT();
        
    }

    init(json = null) {

        this.state = {
            ...this.state,
            name: new ArgsString(json?.name ?? "FT Transfer"),
            addr: new ArgsAccount(json?.address ?? window.nearConfig.WNEAR_ADDRESS),
        };
        
        this.loadErrors = (() => {

            for (let e in this.baseErrors)
                this.errors[e].validOrNull(this.state[e])

            this.errors.noToken.validOrNull(this.state.addr);

            this.updateFT();

        }).bind(this);


    }

    checkIntegrity() {

        const storageDepositTasks = this.tasks.filter(t => t instanceof StorageDeposit);
        const ftTransferTasks = this.tasks.filter(t => t instanceof Transfer);

        // // sanity check: storageDepositTasks does not mention same target twice
        // const targets = storageDepositTasks.map(t => t.call.args.value.account_id);
        // if (targets.length !== new Set(targets).size)
        //     throw new Error("Duplicate storage_deposit");

        // // sanity check: every storage_deposit belongs to a ft_transfer
        // if (Object.values(targets).some(t => !ftTransferTasks.find(task => task.call.args.value.receiver_id === t.receiver_id)))
        //     throw new Error("Found stray storage_deposit");

        // order actions: storage_deposits must appear before ft_transfer
        this.sdOffset = storageDepositTasks.length;
        this.tasks = [...storageDepositTasks, ...ftTransferTasks];

    }

    onTasksLoaded() {

        this.checkIntegrity();

        for (let t of this.tasks.slice(this.sdOffset)) {
            if (t instanceof StorageDeposit) continue;
            const receiver = t.call.args.value.receiver_id.value;
            this.targets[t.props.id] ??= {
                receiver_id: receiver,
                expandInEditor: true,
                ft_transfer: new Set([t.props.id]),
                storage_deposit: new Set(
                    this.tasks
                        .slice(0, this.sdOffset)
                        .filter(task => task.call.args.value.account_id.value === receiver)
                        .map(task => task.props.id)
                )
            };
        }

    }

    static inferOwnType(json) {
        return !!json 
            && json.actions.length > 1 
            && json.actions.every(a => 
                a.func === "storage_deposit" 
                || a.func === "ft_transfer"
            );
    }

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

    addStorageDeposit(target) {

        // a storage deposit for this target already exists
        const alreadyExists = this.tasks
            .slice(0, this.sdOffset)
            .some(t => t.call.args.value.account_id.value === target);
        if (alreadyExists) return;

        const newId = this.addNewTask(
            "near", 
            "storage_deposit",
            {
                address: this.state.addr.value,
                actions: [{
                    args: {
                        account_id: target,
                        registration_only: true
                    }
                }]
            },
            this.updateCard
        );
        // add to all transfers to given target
        Object.values(this.targets)
            .filter(t => t.receiver_id === target)
            .forEach(t => t.storage_deposit.add(newId));

    }

    removeStorageDeposit(target) {

        const affected = Object.values(this.targets).filter(t => t.receiver_id === target);
        const affectedSDTasks = affected
            .map(a => [...a.storage_deposit])
            .flat();

        // delete all linked storage deposits
        new Set(affectedSDTasks).forEach(id => LAYOUT.deleteTask(id));

        affected.forEach(a => a.storage_deposit.clear());
        this.updateCard();

    }

    addFtTransfer(target) {

        const newId = this.addNewTask(
            "near", 
            "ft_transfer",
            {
                address: this.state.addr.value,
                actions: [{
                    args: {
                        receiver_id: target,
                        amount: 0,
                        memo: ""
                    }
                }]
            },
            this.updateCard
        );
        this.targets[newId] = {
            receiver_id: target,
            expandInEditor: true,
            ft_transfer: new Set([newId]),
            storage_deposit: new Set(
                this.tasks
                    .filter(t => t instanceof StorageDeposit)
                    .filter(task => task.call.args.value.account_id.value === target)
                    .map(task => task.props.id)
            )
        };

    }

    removeFtTransfer(taskId) {

        const target = this.targets[taskId] 
        target.ft_transfer.forEach(id => LAYOUT.deleteTask(id));

        // only delete storage_deposits, that are not linked elsewhere
        const notAffected = Object.entries(this.targets).filter(([k, v]) => k !== taskId);
        const notAffectedSDTasks = new Set(notAffected
            .map(([k, v]) => [...v.storage_deposit])
            .flat());
        target.storage_deposit.forEach(id => {
            if (!notAffectedSDTasks.has(id))
                LAYOUT.deleteTask(id);
        });

        delete this.targets[taskId];
        this.updateCard();

    }

    addNewTarget(newTarget, newAddrError) {

        if (newAddrError.isBad) return;
        const receiver = newTarget.value;

        this.addFtTransfer(receiver);

        view(
            this.state.addr.value,
            "storage_balance_of",
            {account_id: receiver}
        )
        .catch(e => {})
        .then((storage) => {
            if (storage === null)
                this.addStorageDeposit(receiver);
        })

    }

    removeStray() {

        // only delete storage_deposits, that are not linked anywhere
        const notStray = Object.values(this.targets).map(t => t.receiver_id);
        this.tasks.forEach(t => {
            if (t instanceof StorageDeposit && !notStray.includes(t.call.args.value.account_id.value)) {
                
                Object.values(this.targets).forEach(v => v.storage_deposit.delete(t.props.id));
                LAYOUT.deleteTask(t.props.id);

            }
        });

    }

    toggleExpand(id) {

        this.targets[id].expandInEditor = !this.targets[id].expandInEditor;
        EDITOR.forceUpdate();

    }

    updateSD(target) {

        view(
            this.state.addr.value,
            "storage_balance_of",
            {account_id: target}
        )
        .catch(e => {})
        .then((storage) => {
            if (storage === null) {
                this.addStorageDeposit(target);
                this.updateCard();
            }
        })

    }

    updateFT() {

        const { addr } = this.state;

        this.errors.noToken.isBad = false;

        if (this.errors.addr.isBad)
            return;

        view(
            addr.value,
            "ft_metadata",
            {}
        )
        .catch(e => {
            if (e.type === "AccountDoesNotExist" || e.toString().includes("MethodNotFound"))
                this.errors.noToken.isBad = true;
        })

        Object.keys(this.targets).forEach(id => 
            view(
                addr.value,
                "storage_balance_of",
                {account_id: this.targets[id].receiver_id}
            )
            .catch(e => {})
            .then((storage) => {
                if (storage === undefined) return;
                if (storage === null)
                    this.addStorageDeposit(this.targets[id].receiver_id)
                else
                    this.removeStorageDeposit(this.targets[id].receiver_id)
            })
        )

    }

    renderEditor() {

        const {
            name,
            addr
        } = this.state;

        const errors = this.errors;

        const newTarget = new ArgsAccount("");
        const newAddrError = new ArgsError("Invalid address", value => ArgsAccount.isValid(value));

        // TODO debounce task.updateCard for performance
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
                    label="Token address"
                    value={ addr }
                    error={[ errors.addr, errors.noToken ]}
                    update={ (e) => {
                        this.updateCard();
                        this.updateFTDebounced();
                        this.tasks.forEach(t => {
                            t.call.addr.value = e.target.value;
                            t.errors.addr.validOrNull(e.target.value);
                            t.errors.noToken.validOrNull(e.target.value);
                            t.updateCard();
                            t.updateFTDebounced();
                        });
                    } }
                />
                {
                    Object.keys(this.targets).map(id => <div className={`section ${this.targets[id].expandInEditor ? "" : "collapsed"}`}>
                        <h2>
                            <Icon 
                                className="icon collapse"
                                onClick={() => this.toggleExpand(id)}
                                collapsed={ this.targets[id].expandInEditor ? "no" : "yes" }
                            >expand_more</Icon> 
                            <p>{this.targets[id].receiver_id}</p>
                            <Icon 
                                className="icon delete"
                                onClick={ () => this.removeFtTransfer(id) }
                            >delete_outline</Icon>
                        </h2>
                        { this.targets[id].expandInEditor && [...this.targets[id].ft_transfer].map(fttid => {
                            const task = TASKS.find(t => t.id === fttid).instance.current;
                            const { receiver_id, amount, memo } = task.call.args.value;
                            const errors = task.errors;
                            return (<>
                                <TextInput 
                                    label="Receiver"
                                    value={ receiver_id }
                                    error={ errors.receiver }
                                    update={ (e) => {
                                        const target = this.targets[id];
                                        target.receiver_id = receiver_id.value;
                                        target.storage_deposit = new Set(
                                            this.tasks
                                                .slice(0, this.sdOffset)
                                                .filter(task => task.call.args.value.account_id.value === receiver_id.value)
                                                .map(task => task.props.id)
                                        )
                                        if (target.storage_deposit.size === 0)
                                            this.updateSDDebounced(receiver_id.value);
                                        this.removeStray();
                                        this.updateCard();
                                        task.updateCard();
                                    } }
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end">
                                            <a href={ArgsAccount.toUrl(this.targets[id].receiver_id)} target="_blank" rel="noopener noreferrer">
                                                <Icon 
                                                    className="icon link"
                                                >open_in_new</Icon>
                                            </a>
                                        </InputAdornment>,
                                    }}
                                />
                                <TextInput
                                    label="Transfer amount"
                                    value={ amount }
                                    error={ errors.amount }
                                    update={ () => {
                                        this.updateCard();
                                        task.updateCard();
                                    } }
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end">{amount.unit}</InputAdornment>,
                                    }}
                                />
                                <TextInput 
                                    label="Memo"
                                    value={ memo }
                                    multiline
                                    update={ () => {
                                        this.updateCard();
                                        task.updateCard();
                                    } }
                                />
                            </>)
                        }) }
                        <div className="checkbox">
                            <Checkbox
                                checked={this.targets[id].storage_deposit.size > 0}
                                onChange={e => {
                                    if (e.target.checked)
                                        this.addStorageDeposit(this.targets[id].receiver_id);
                                    else 
                                        this.removeStorageDeposit(this.targets[id].receiver_id);
                                    this.updateCard();
                                }}
                            />
                            <p>Pay storage deposit</p>
                        </div>
                    </div>)
                }
                <div className="add-action">
                    <h2>Add Transfer</h2>
                    <TextInput 
                        label="Target address"
                        value={ newTarget }
                        error={ newAddrError }
                        update={ (e, textInputComponent) => textInputComponent.forceUpdate() }
                        onKeyUp={ e => {
                            if (e.key === "Enter")
                                this.addNewTarget(newTarget, newAddrError);
                        } }
                    />
                    <button
                        onClick={ () => this.addNewTarget(newTarget, newAddrError) }
                    >
                        <Icon>add</Icon>
                        Add
                    </button>
                </div>
            </div>
        );

    }

}