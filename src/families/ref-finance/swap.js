import TextField from '@mui/material/TextField';
import React from 'react';
import { ArgsAccount, ArgsBig, ArgsError, ArgsNumber, ArgsString, ArgsObject } from "../../utils/args";
import Call from "../../utils/call";
import { toGas } from "../../utils/converter";
import BaseTask from "../base";
import "./ref-finance.scss";

export default class Swap extends BaseTask {

    uniqueClassName = "ref-swap-task";
    errors = {
        ...this.baseErrors,
        addr: new ArgsError("Invalid address", value => true),
        args: new ArgsError("Invalid JSON", value => true),
        token_in: new ArgsError("Invalid address", value => ArgsAccount.isValid(value)),
        amount_in: new ArgsError("Amount out of bounds", value => ArgsBig.isValid(value)),
        token_out: new ArgsError("Invalid address", value => ArgsAccount.isValid(value)),
        min_amount_out: new ArgsError("Amount out of bounds", value => ArgsBig.isValid(value)),
        func: new ArgsError("Cannot be empty", value => value != ""),
        gas: new ArgsError("Amount out of bounds", value => ArgsNumber.isValid(value)),
    };

    init(json = null) {

        this.call = new Call({
            name: new ArgsString(json?.name ?? "Swap on Ref"),
            addr: new ArgsAccount(json?.name ?? "ref-finance.near"),
            func: new ArgsString(json?.func ?? "swap"),
            args: new ArgsObject(json?.args 
                ? {
                    token_in: new ArgsAccount(json?.args.token_in),
                    amount_in: new ArgsBig(json?.args.amount, "0", null, null),
                    token_out: new ArgsAccount(json?.args.token_out),
                    min_amount_out: new ArgsBig(json?.args.min_amount_out, "0", null, null)
                }
                : {
                    token_in: new ArgsAccount("marmaj.tkn.near"),
                    amount_in: new ArgsBig("1", "0", null, null),
                    token_out: new ArgsAccount("wrap.near"),
                    min_amount_out: new ArgsBig("1", "0", null, null)                
                }    
            ),
            gas: new ArgsNumber(json?.gas ?? toGas(95), 1, toGas(300), "gas"),
            depo: new ArgsBig(json?.depo ?? "1", "1", null, "yocto")
        });

    }

    renderEditor() {

        const {
            name,
            addr,
            gas
        } = this.call;

        const {
            token_in,
            amount_in,
            token_out,
            min_amount_out
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
                    label="Token In"
                    value={ token_in }
                    margin="dense"
                    size="small"
                    onChange={e => {
                        token_in.value = e.target.value;
                        errors.token_in.validOrNull(token_in.value);
                        this.forceUpdate();
                        EDITOR.forceUpdate();
                    }}
                    error={errors.token_in.isBad}
                    helperText={errors.token_in.isBad && errors.token_in.message}
                    InputLabelProps={{shrink: true}}
                />
                <TextField
                    label="Token Out"
                    value={ token_out }
                    margin="dense"
                    size="small"
                    onChange={e => {
                        token_out.value = e.target.value;
                        errors.token_out.validOrNull(token_out.value);
                        this.forceUpdate();
                        EDITOR.forceUpdate();
                    }}
                    error={errors.token_out.isBad}
                    helperText={errors.token_out.isBad && errors.token_out.message}
                    InputLabelProps={{shrink: true}}
                />
                <div className="unitInput">
                    <TextField
                        label="Amount In"
                        value={ amount_in.value }
                        margin="dense"
                        size="small"
                        type="number"
                        onChange={e => {
                            amount_in.value = e.target.value;
                            errors.amount_in.validOrNull(amount_in);
                            this.forceUpdate();
                            EDITOR.forceUpdate();
                        }}
                        error={errors.amount_in.isBad}
                        helperText={errors.amount_in.isBad && errors.amount_in.message}
                        InputLabelProps={{shrink: true}}
                    />
                    <TextField
                        label="Unit"
                        value={ token_in }
                        margin="dense"
                        size="small"
                        disabled
                    />
                </div>
                <div className="unitInput">
                    <TextField
                        label="Min Amount Out"
                        value={ min_amount_out.value }
                        margin="dense"
                        size="small"
                        type="number"
                        onChange={e => {
                            min_amount_out.value = e.target.value;
                            errors.min_amount_out.validOrNull(min_amount_out);
                            this.forceUpdate();
                            EDITOR.forceUpdate();
                        }}
                        error={errors.min_amount_out.isBad}
                        helperText={errors.min_amount_out.isBad && errors.min_amount_out.message}
                        InputLabelProps={{shrink: true}}
                    />
                    <TextField
                        label="Unit"
                        value={ token_out }
                        margin="dense"
                        size="small"
                        disabled
                    />
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