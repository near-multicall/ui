import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import React from 'react';
import { ArgsAccount, ArgsBig, ArgsNumber, ArgsString, ArgsObject, ArgsError } from "../../utils/args";
import Call from "../../utils/call";
import { toGas } from "../../utils/converter";
import BaseTask from "../base";
import "./multicall.scss";

export default class Transfer extends BaseTask {

    uniqueClassName = "multicall-transfer-task";
    errors = {
        ...this.baseErrors,
        addr: new ArgsError("Invalid address", value => true),
        func: new ArgsError("Cannot be empty", value => value != ""),
        args: new ArgsError("Invalid JSON", value => true),
        receiver: new ArgsError("Invalid address", value => ArgsAccount.isValid(value), true),
        amount: new ArgsError("Amount out of bounds", value => ArgsBig.isValid(value)),
        gas: new ArgsError("Amount out of bounds", value => ArgsNumber.isValid(value)),
    };

    transferAll = false;

    init(json = null) {

        this.call = new Call({
            name: new ArgsString(json?.name ?? "Transfer Near"),
            addr: new ArgsAccount(window?.LAYOUT?.state.addresses.multicall ?? ""),
            func: new ArgsString(json?.func ?? "near_transfer"),
            args: new ArgsObject(json?.args 
                ? {
                    account_id: new ArgsAccount(json?.args.account_id),
                    amount: new ArgsBig(json?.args.amount, "0", null, "yocto")
                }
                : {
                    account_id: new ArgsAccount(""),
                    amount: new ArgsBig("0", "0", null, "yocto")                    
                }    
            ),
            gas: new ArgsNumber(json?.gas ?? toGas(3), 0, toGas(300), "gas"),
            depo: new ArgsBig("0", "0", "0", "yocto")
        });

    }

    renderEditor() {

        const {
            name,
            addr,
            gas
        } = this.call;

        const {
            account_id,
            amount
        } = this.call.args.value;

        const errors = this.errors;

        const gasOrTgas = [
            {
                value: 'gas',
                label: 'gas'
            },
            {
                value: 'Tgas',
                label: 'Tgas'
            },
        ];

        const yoctoOrNear = [
            {
                value: 'yocto',
                label: 'yocto'
            },
            {
                value: 'NEAR',
                label: 'NEAR'
            },
        ];

        return (
            <div className="edit">
                <TextField
                    value={ name }
                    variant="standard"
                    margin="normal"
                    onChange={e => {
                        name.value = e.target.value;
                        this.forceUpdate();
                    }}
                    InputLabelProps={{shrink: true}}
                />
                <TextField
                    label="Receiver address"
                    value={ account_id }
                    margin="dense"
                    size="small"
                    onChange={e => {
                        account_id.value = e.target.value;
                        errors.receiver.validOrNull(account_id.value);
                        this.forceUpdate();
                        EDITOR.forceUpdate();
                    }}
                    error={errors.receiver.isBad}
                    helperText={errors.receiver.isBad && errors.receiver.message}
                    InputLabelProps={{shrink: true}}
                />
                <div className="checkbox">
                    <Checkbox
                        checked={this.transferAll}
                        onChange={e => {
                            this.transferAll = e.target.checked;
                            amount.value = "0";
                            amount.unit = "yocto";
                            this.forceUpdate();
                            EDITOR.forceUpdate();
                        }}
                    />
                    <p>Transfer all available funds</p>
                </div>
                <div className="unitInput">
                    <TextField
                        label="Transfer amount"
                        value={ amount.value }
                        margin="dense"
                        size="small"
                        type="number"
                        onChange={e => {
                            amount.value = e.target.value;
                            errors.amount.validOrNull(amount);
                            this.forceUpdate();
                            EDITOR.forceUpdate();
                        }}
                        disabled={this.transferAll}
                        error={errors.amount.isBad}
                        helperText={errors.amount.isBad && errors.amount.message}
                        InputLabelProps={{shrink: true}}
                    />
                    <TextField
                        label="Unit"
                        value={ amount.unit }
                        margin="dense"
                        size="small"
                        select
                        onChange={e => {
                            amount.unit = e.target.value;
                            errors.amount.validOrNull(amount);
                            EDITOR.forceUpdate();
                            this.forceUpdate();
                        }}
                        disabled={this.transferAll}
                        SelectProps={{
                            native: true,
                        }}
                    >
                        { yoctoOrNear.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        )) }
                    </TextField>
                </div>
                <div className="unitInput">
                    <TextField
                        label="Allocated gas"
                        value={ gas }
                        margin="dense"
                        size="small"
                        type="number"
                        onChange={e => {
                            gas.value = e.target.value;
                            errors.gas.validOrNull(gas);
                            this.forceUpdate();
                            EDITOR.forceUpdate();
                        }}
                        error={errors.gas.isBad}
                        helperText={errors.gas.isBad && errors.gas.message}
                        InputLabelProps={{shrink: true}}
                    />
                    <TextField
                        label="Unit"
                        value={ gas.unit }
                        margin="dense"
                        size="small"
                        select
                        onChange={e => {
                            gas.unit = e.target.value;
                            errors.gas.validOrNull(gas);
                            EDITOR.forceUpdate();
                            this.forceUpdate();
                        }}
                        SelectProps={{
                            native: true,
                        }}
                    >
                        { gasOrTgas.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        )) }
                    </TextField>
                </div>
            </div>
        );

    }

}