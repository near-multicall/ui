import { Icon, InputAdornment } from '@mui/material';
import Checkbox from '@mui/material/Checkbox';
import debounce from "lodash.debounce";
import React from 'react';
import { TextInput } from '../../components/editor/elements';
import { ArgsAccount, ArgsError, ArgsString } from "../../utils/args";
import { view } from "../../utils/wallet";
import BatchTask from '../batch';
import "./near.scss";
import Transfer from './transfer';

export default class Transfer_Batch extends BatchTask {

    uniqueClassName = "near-transfer-task";
    errors = {
        ...this.baseErrors,
        noToken: new ArgsError("Address does not belong to token contract", value => this.errors.noToken)
    };

    targets = {};

    updateFTDebounced = debounce(() => this.updateFT(), 500);

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

    onTasksLoaded() {

        for (let t of this.tasks) {
            const receiver = t instanceof Transfer
                ? t.call.args.value.receiver_id.value
                : t.call.args.value.account_id.value
            this.targets[receiver] ??= {
                receiver_id: receiver,
                ft_transfer: new Set(),
                storage_deposit: new Set()
            };
            this.targets[receiver][t.call.func.value].add(t.props.id);
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

        if (this.targets[target].storage_deposit.size > 0) return;
        this.targets[target].storage_deposit.add(this.addNewTask(
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
        ));

    }

    removeStorageDeposit(target) {

        this.targets[target].storage_deposit.forEach(id => LAYOUT.deleteTask(id));
        this.targets[target].storage_deposit.clear();

    }

    addFtTransfer(target) {

        this.targets[target].ft_transfer.add(this.addNewTask(
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
        ));

    }

    removeFtTransfer(target) {

        [
            ...this.targets[target].storage_deposit, 
            ...this.targets[target].ft_transfer
        ]
            .forEach(id => LAYOUT.deleteTask(id));
        delete this.targets[target];
        this.updateCard();

    }

    addNewTarget(newTarget, newAddrError) {

        if (newAddrError.isBad) return;
        const receiver = newTarget.value;

        this.targets[receiver] ??= {
            receiver_id: receiver,
            ft_transfer: new Set(),
            storage_deposit: new Set()
        };

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

        Object.keys(this.targets).forEach(t => 
            view(
                addr.value,
                "storage_balance_of",
                {account_id: t}
            )
            .catch(e => {})
            .then((storage) => {
                console.log(storage);
                if (storage === undefined) return;
                if (storage === null)
                    this.addStorageDeposit(t)
                else
                    this.removeStorageDeposit(t)
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
                    Object.keys(this.targets).map(t => <div className="section">
                        <h2>
                            {t}
                            <Icon 
                                className="delete-icon"
                                onClick={ () => this.removeFtTransfer(t) }
                            >delete_outline</Icon>
                        </h2>
                        { [...this.targets[t].ft_transfer].map(id => {
                            const task = TASKS.find(t => t.id === id).instance.current;
                            const { amount, memo } = task.call.args.value;
                            const errors = task.errors;
                            return (<>
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
                                checked={this.targets[t].storage_deposit.size > 0}
                                onChange={e => {
                                    if (e.target.checked)
                                        this.addStorageDeposit(t);
                                    else 
                                        this.removeStorageDeposit(t);
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