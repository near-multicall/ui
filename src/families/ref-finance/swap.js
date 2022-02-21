import { TextField } from '@mui/material';
import React from 'react';
import { TextInput, TextInputWithUnits } from '../../components/editor/elements';
import { ArgsAccount, ArgsBig, ArgsError, ArgsNumber, ArgsString, ArgsObject, ArgsArray } from "../../utils/args";
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
        pool_id: new ArgsError("Invalid pool id", value => ArgsNumber.isValid(value)),
        token_in: new ArgsError("Invalid address", value => ArgsAccount.isValid(value)),
        amount_in: new ArgsError("Amount out of bounds", value => ArgsBig.isValid(value)),
        token_out: new ArgsError("Invalid address", value => ArgsAccount.isValid(value)),
        min_amount_out: new ArgsError("Amount out of bounds", value => ArgsBig.isValid(value)),
        func: new ArgsError("Cannot be empty", value => value != ""),
        gas: new ArgsError("Amount out of bounds", value => ArgsNumber.isValid(value)),
    };

    init(json = null) {

        const actions = json?.actions?.[0];

        this.call = new Call({
            name: new ArgsString(json?.name ?? "Swap on Ref"),
            addr: new ArgsAccount(json?.address ?? "ref-finance.near"),
            func: new ArgsString(actions?.func ?? "swap"),
            args: new ArgsObject({
                actions: new ArgsArray(actions?.args?.actions?.[0]
                    ? new ArgsObject({
                        pool_id: new ArgsNumber(actions.args.actions[0].pool_id),
                        token_in: new ArgsAccount(actions.args.actions[0].token_in),
                        amount_in: new ArgsBig(actions.args.actions[0].amount_in, "0", null),
                        token_out: new ArgsAccount(actions.args.actions[0].token_out),
                        min_amount_out: new ArgsBig(actions.args.actions[0].min_amount_out, "0", null)
                    })
                    : new ArgsObject({
                        pool_id: new ArgsNumber(11, 0, null),
                        token_in: new ArgsAccount("marmaj.tkn.near"),
                        amount_in: new ArgsBig("1", "0", null),
                        token_out: new ArgsAccount("wrap.near"),
                        min_amount_out: new ArgsBig("1", "0", null)                
                    })
                )
            }),
            gas: new ArgsNumber(actions?.gas ?? toGas(95), 1, toGas(300), "gas"),
            depo: new ArgsBig(actions?.depo ?? "1", "1", null, "yocto")
        });

    }

    renderEditor() {

        const {
            name,
            gas
        } = this.call;

        const {
            pool_id,
            token_in,
            amount_in,
            token_out,
            min_amount_out
        } = this.call.args.value.actions.value[0].value;

        const errors = this.errors;

        return (
            <div className="edit">
                <TextInput
                    variant="standard"
                    margin="normal"
                    value={ name }
                    update={ this.updateCard }
                />
                <TextInput
                    label="Poll ID"
                    value={ pool_id }
                    error={ errors.pool_id }
                    update={ this.updateCard }
                />
                <TextInput
                    label="Token ID"
                    value={ token_in }
                    error={ errors.token_in }
                    update={ this.updateCard }
                />
                <TextInput
                    label="Token Out"
                    value={ token_out }
                    error={ errors.token_out }
                    update={ this.updateCard }
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
                            this.updateCard();
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
                            this.updateCard();
                        }}
                        error={errors.min_amount_out.isBad}
                        helperText={errors.min_amount_out.isBad && errors.min_amount_out.message}
                        InputLabelProps={{shrink: true}}
                        update={ this.updateCard }
                    />
                    <TextField
                        label="Unit"
                        value={ token_out }
                        margin="dense"
                        size="small"
                        disabled
                    />
                </div>
                <TextInputWithUnits 
                    label="Allocated gas"
                    value={ gas }
                    error={ errors.gas }
                    options={[ "gas", "Tgas" ]}
                    update={ this.updateCard }
                />
            </div>
        );

    }

}