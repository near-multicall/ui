import { InputAdornment } from '@mui/material';
import React from 'react';
import { TextInput, TextInputWithUnits } from '../../components/editor/elements';
import { ArgsAccount, ArgsBig, ArgsError, ArgsObject, ArgsString } from "../../utils/args";
import Call from "../../utils/call";
import { toGas } from "../../utils/converter";
import { view } from "../../utils/wallet";
import BaseTask from "../base";
import "./near.scss";


export default class Transfer extends BaseTask {

    uniqueClassName = "near-transfer-task";
    errors = {
        ...this.baseErrors,
        addr: new ArgsError("Invalid address", value => ArgsAccount.isValid(value)),
        func: new ArgsError("Cannot be empty", value => value != ""),
        args: new ArgsError("Invalid JSON", value => true),
        receiver: new ArgsError("Invalid address", value => ArgsAccount.isValid(value), !ArgsAccount.isValid(this.call.args.value.receiver_id)),
        amount: new ArgsError("Amount out of bounds", value => ArgsBig.isValid(value)),
        gas: new ArgsError("Amount out of bounds", value => ArgsBig.isValid(value)),
        noToken: new ArgsError("Address does not belong to token contract", value => this.errors.noToken)
    };

    lastInput;

    constructor(props) {

        super(props);

        window.WALLET.then(() => this.updateFT());

    }

    init(json = null) {

        const actions = json?.actions?.[0];

        this.call = new Call({
            name: new ArgsString(json?.name ?? "FT Transfer"),
            addr: new ArgsAccount(json?.address ?? window.nearConfig.WNEAR_ADDRESS),
            func: new ArgsString(actions?.func ?? "ft_transfer"),
            args: new ArgsObject(actions?.args 
                ? {
                    receiver_id: new ArgsAccount(actions.args.receiver_id),
                    amount: new ArgsBig(actions.args.amount, "0", null, "yocto"),
                    memo: new ArgsString(actions.args.memo)
                }
                : {
                    receiver_id: new ArgsAccount(""),
                    amount: new ArgsBig("0", "0", null, "yocto"),
                    memo: new ArgsString("")
                }    
            ),
            gas: new ArgsBig(actions?.gas ?? "7", toGas("1"), toGas("300"), "Tgas"),
            depo: new ArgsBig("1", "1", "1", "yocto")
        });

    }

    updateFT() {

        const { addr, args } = this.call;
        const { amount } = args.value;

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
        .then(res => {
            if (res) {
                amount.unit = res.symbol;
                amount.decimals = res.decimals;
            }
            this.updateCard()
        })

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
                    label="Token address"
                    value={ addr }
                    error={[ errors.addr, errors.noToken ]}
                    update={ () => {
                        this.updateCard();
                        setTimeout(() => {
                            if (new Date() - this.lastInput > 400)
                                this.updateFT()
                        }, 500)
                        this.lastInput = new Date()
                    } }
                />
                <TextInput 
                    label="Receiver address"
                    value={ receiver_id }
                    error={ errors.receiver }
                    update={ this.updateCard }
                />
                <TextInput
                    label="Transfer amount"
                    value={ amount }
                    error={ errors.amount }
                    update={ this.updateCard }
                    InputProps={{
                        endAdornment: <InputAdornment position="end">{amount.unit}</InputAdornment>,
                    }}
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
                    options={[ "Tgas", "gas" ]}
                    update={ this.updateCard }
                />
            </div>
        );

    }

}