import Checkbox from '@mui/material/Checkbox';
import React from 'react';
import { ArgsAccount, ArgsBig, ArgsNumber, ArgsString, ArgsObject, ArgsError } from "../../utils/args";
import Call from "../../utils/call";
import { toGas } from "../../utils/converter";
import BaseTask from "../base";
import "./multicall.scss";
import { TextInput, TextInputWithUnits } from '../../components/editor/elements';

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

    options = {
        all: false
    }

    init(json = null) {

        const actions = json?.actions?.[0];

        this.call = new Call({
            name: new ArgsString(json?.name ?? "Transfer Near"),
            addr: new ArgsAccount(PERSISTENT.addresses.multicall ?? ""),
            func: new ArgsString(actions?.func ?? "near_transfer"),
            args: new ArgsObject(actions?.args 
                ? {
                    account_id: new ArgsAccount(actions.args.account_id),
                    amount: new ArgsBig(actions.args.amount, "0", null, "yocto")
                }
                : {
                    account_id: new ArgsAccount(""),
                    amount: new ArgsBig("0", "0", null, "yocto")                    
                }    
            ),
            gas: new ArgsNumber(actions?.gas ?? toGas(3), 0, toGas(300), "gas"),
            depo: new ArgsBig("0", "0", "0", "yocto")
        });

    }


    onAddressesUpdated() {

        this.call.addr.value = PERSISTENT.addresses.multicall;
        this.errors.addr.validOrNull(this.call.addr.value);
        this.forceUpdate();

    }

    renderEditor() {

        const {
            name,
            gas
        } = this.call;

        const {
            account_id,
            amount
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
                    label="Receiver address"
                    value={ account_id }
                    error={ errors.receiver }
                    update={ this.updateCard }
                />
                <div className="checkbox">
                    <Checkbox
                        checked={this.transferAll}
                        onChange={e => {
                            this.options.all = e.target.checked;
                            this.call.args.value.amount.omit = e.target.checked;
                            this.updateCard();
                        }}
                    />
                    <p>Transfer all available funds</p>
                </div>
                { !this.options.all  
                    ? <TextInputWithUnits
                        label="Transfer amount"
                        value={ amount }
                        error={ errors.amount }
                        options={[ "yocto", "NEAR" ]}
                        update={ this.updateCard }
                    />
                    : <></>
                }
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