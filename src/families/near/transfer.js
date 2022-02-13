import React from 'react';
import { TextInput, TextInputWithUnits } from '../../components/editor/elements';
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

        return (
            <div className="edit">
                <TextInput 
                    value={ name }
                    variant="standard"
                    margin="normal"
                    update={ this.updateCard }
                />
                <TextInput 
                    label="Contract address"
                    value={ addr }
                    error={ errors.addr }
                    update={ this.updateCard }
                />
                <TextInput 
                    label="Receiver address"
                    value={ receiver_id }
                    error={ errors.receiver }
                    update={ this.updateCard }
                />
                <TextInputWithUnits
                    label="Transfer amount"
                    value={ amount }
                    error={ errors.amount }
                    options={[ "yocto", "NEAR" ]}
                    update={ this.updateCard }
                />
                <TextInput 
                    label="Memo"
                    value={ memo }
                    multiline
                    update={ this.updateCard }
                />
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