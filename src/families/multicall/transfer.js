import Checkbox from '@mui/material/Checkbox';
import React from 'react';
import { ArgsAccount, ArgsBig, ArgsString, ArgsObject, ArgsError } from "../../utils/args";
import Call from "../../utils/call";
import { toGas, toYocto, formatTokenAmount } from "../../utils/converter";
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
        const units = json?.units?.actions?.[0];

        this.call = new Call({
            name: new ArgsString(json?.name ?? "Transfer Near"),
            addr: new ArgsAccount(STORAGE.addresses.multicall ?? ""),
            func: new ArgsString(actions?.func ?? "near_transfer"),
            args: new ArgsObject(actions?.args 
                ? {
                    account_id: new ArgsAccount(actions.args.account_id),
                    amount: actions.args.amount 
                        ? new ArgsBig(
                            formatTokenAmount(actions.args.amount, units.args.amount.decimals),
                            toYocto("0"), 
                            null, 
                            units.args.amount.unit,
                            units.args.amount.decimals
                        )
                        : new ArgsBig("0", "0", "0")
                }
                : {
                    account_id: new ArgsAccount(""),
                    amount: new ArgsBig("0", toYocto("0"), null, "NEAR")                    
                }    
            ),
            gas: new ArgsBig(
                formatTokenAmount(actions?.gas ?? "3", units?.gas.decimals),
                toGas("1"), 
                toGas("300"), 
                units?.gas?.unit ?? "Tgas",
                units?.gas?.decimals
            ),
            depo: new ArgsBig("1", "1", "1", "yocto")
        });

        if ((actions?.args?.account_id !== undefined && actions.args.amount === undefined) || json?.options?.all) {
            this.call.args.value.amount.omit = true;
            this.options.all = true;
        }

        if (json?.errors)
            this.errors = json.errors
    
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