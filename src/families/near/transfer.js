import TextField from '@mui/material/TextField';
import React from 'react';
import { ArgsAccount, ArgsBig, ArgsNumber, ArgsString, ArgsObject, ArgsError } from "../../utils/args";
import Call from "../../utils/call";
import { toGas } from "../../utils/converter";
import BaseTask from "../base";
import "./near.scss";

export default class Transfer extends BaseTask {

    uniqueClassName = "near-transfer-task";
    errors = {
        ...this.baseErrors,
        addr: new ArgsError("Invalid address", value => ArgsAccount.isValid(value)),
        func: new ArgsError("Cannot be empty", value => value != ""),
        args: new ArgsError("Invalid JSON", value => true),
        receiver: new ArgsError("Invalid address", value => ArgsAccount.isValid(value), true),
        amount: new ArgsError("Amount out of bounds", value => ArgsBig.isValid(value)),
        gas: new ArgsError("Amount out of bounds", value => ArgsNumber.isValid(value)),
    };

    init(json = null) {

        this.call = new Call({
            name: new ArgsString(json?.name ?? "FT Transfer"),
            addr: new ArgsAccount(json?.addr ?? "marmaj.tkn.near"),
            func: new ArgsString(json?.func ?? "ft_transfer"),
            args: new ArgsObject(json?.args 
                ? {
                    receiver_id: new ArgsAccount(json?.args.receiver_id),
                    amount: new ArgsBig(json?.args.amount, "0", null, "yocto"),
                    memo: new ArgsString(json?.args.memo)
                }
                : {
                    receiver_id: new ArgsAccount(""),
                    amount: new ArgsBig("0", "0", null, "yocto"),
                    memo: new ArgsString("")
                }    
            ),
            gas: new ArgsNumber(json?.gas ?? toGas(7), 0, toGas(300), "gas"),
            depo: new ArgsBig("1", "1", "1", "yocto")
        });

    }

    renderEditor() {

        const {
            name,
            addr,
            gas
        } = this.call;

        const {
            receiver_id,
            amount,
            memo
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
                    label="Contract address"
                    value={ addr }
                    margin="dense"
                    size="small"
                    onChange={e => {
                        addr.value = e.target.value;
                        errors.addr.validOrNull(addr.value);
                        this.forceUpdate();
                        EDITOR.forceUpdate();
                    }}
                    error={errors.addr.isBad}
                    helperText={errors.addr.isBad && errors.addr.message}
                    InputLabelProps={{shrink: true}}
                />
                <TextField
                    label="Receiver address"
                    value={ receiver_id }
                    margin="dense"
                    size="small"
                    onChange={e => {
                        receiver_id.value = e.target.value;
                        errors.receiver.validOrNull(receiver_id.value);
                        this.forceUpdate();
                        EDITOR.forceUpdate();
                    }}
                    error={errors.receiver.isBad}
                    helperText={errors.receiver.isBad && errors.receiver.message}
                    InputLabelProps={{shrink: true}}
                />
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
                <TextField
                    label="Memo"
                    value={ memo.value }
                    margin="dense"
                    size="small"
                    multiline
                    onChange={e => {
                        memo.value = e.target.value;
                        this.forceUpdate();
                        EDITOR.forceUpdate();
                    }}
                    InputLabelProps={{shrink: true}}
                />
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