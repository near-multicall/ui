import { InputAdornment } from '@mui/material';
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

    }

    renderEditor() {

        const {
            name,
            addr
        } = this.state;

        const errors = this.errors;

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
                        <h2>{t}</h2>
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
                                    if (e.target.checked) {
                                        this.targets[t].storage_deposit.add(this.addNewTask(
                                            "near", 
                                            "storage_deposit",
                                            {
                                                address: addr.value,
                                                actions: [{
                                                    args: {
                                                        account_id: t,
                                                        registration_only: true
                                                    }
                                                }]
                                            },
                                            this.updateCard
                                        ));
                                    } else {
                                        this.targets[t].storage_deposit.forEach(id => LAYOUT.deleteTask(id));
                                        this.targets[t].storage_deposit.clear();
                                    }
                                    this.updateCard();
                                }}
                            />
                            <p>Pay storage deposit</p>
                        </div>
                    </div>)
                }
                <button className="add-action">Add transfer</button>
            </div>
        );

    }

}