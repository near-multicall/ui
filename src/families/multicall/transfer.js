import Checkbox from '@mui/material/Checkbox';
import React from 'react';
import { ArgsAccount, ArgsBig, ArgsString, ArgsObject, ArgsError } from "../../utils/args";
import Call from "../../utils/call";
import { toGas, toYocto } from "../../utils/converter";
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
        receiver: new ArgsError("Invalid address", value => ArgsAccount.isValid(value), !ArgsAccount.isValid(this.call.args.value.account_id)),
        amount: new ArgsError("Amount out of bounds", value => ArgsBig.isValid(value)),
        gas: new ArgsError("Amount out of bounds", value => ArgsBig.isValid(value)),
    };

    options = {
        all: false
    }

    init(json = null) {

        const actions = json?.actions?.[0];

        this.call = new Call({
            name: new ArgsString(json?.name ?? "Transfer Near"),
            addr: new ArgsAccount(STORAGE.addresses.multicall ?? ""),
            func: new ArgsString(actions?.func ?? "near_transfer"),
            args: new ArgsObject(actions?.args 
                ? {
                    account_id: new ArgsAccount(actions.args.account_id),
                    amount: new ArgsBig(actions.args.amount, toYocto("0"), null, "NEAR")
                }
                : {
                    account_id: new ArgsAccount(""),
                    amount: new ArgsBig("0", toYocto("0"), null, "NEAR")                    
                }    
            ),
            gas: new ArgsBig(actions?.gas ?? "3", toGas("1"), toGas("300"), "Tgas"),
            depo: new ArgsBig("1", "1", "1", "yocto")
        });

    }


    onAddressesUpdated() {

        this.call.addr.value = STORAGE.addresses.multicall;
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
                    autoFocus
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
                        options={[ "NEAR", "yocto" ]}
                        update={ this.updateCard }
                    />
                    : <></>
                }
                <TextInputWithUnits
                    label="Allocated gas"
                    value={ gas }
                    error={ errors.gas }
                    options={[ "Tgas", "gas" ]}
                    update={ this.updateCard }
                />
            </div>
        );

    }

}