import Checkbox from '@mui/material/Checkbox';
import React from 'react';
import { ArgsAccount, ArgsBig, ArgsString, ArgsObject, ArgsError } from "../../utils/args";
import Call from "../../utils/call";
import { toGas, toYocto, formatTokenAmount, unitToDecimals } from "../../utils/converter";
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
        receiver: new ArgsError("Invalid address", value => ArgsAccount.isValid(value), !ArgsAccount.isValid(this.calls[0].args.value.account_id)),
        amount: new ArgsError("Amount out of bounds", value => ArgsBig.isValid(value)),
        gas: new ArgsError("Amount out of bounds", value => ArgsBig.isValid(value)),
    };

    options = {
        all: false
    }

    init(json = null) {

        const actions = json?.actions?.[0];
        const units = json?.units?.actions?.[0];

        this.calls = [new Call({
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
                formatTokenAmount(actions?.gas ?? toGas("3.5"), units?.gas.decimals ?? unitToDecimals["Tgas"]),
                toGas("1"), 
                toGas("300"), 
                units?.gas?.unit ?? "Tgas",
                units?.gas?.decimals
            ),
            depo: new ArgsBig("1", "1", "1", "yocto")
        })];

        if ((actions?.args?.account_id !== undefined && actions.args.amount === undefined) || json?.options?.all) {
            this.calls[0].args.value.amount.omit = true;
            this.options.all = true;
        }

        this.loadErrors = (() => {
            for (let e in this.baseErrors)
                this.errors[e].validOrNull(this.calls[0][e])

            this.errors.receiver.validOrNull(this.calls[0].args.value.account_id);
            this.errors.amount.validOrNull(this.calls[0].args.value.amount);
        }).bind(this)
    
    }


    onAddressesUpdated() {

        this.calls[0].addr.value = STORAGE.addresses.multicall;
        this.errors.addr.validOrNull(this.calls[0].addr.value);
        this.forceUpdate();
        
    }

    renderEditor() {

        const {
            name,
            gas
        } = this.calls[0];

        const {
            account_id,
            amount
        } = this.calls[0].args.value;

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
                            this.calls[0].args.value.amount.omit = e.target.checked;
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