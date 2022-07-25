import { InputAdornment } from '@mui/material';
import React from 'react';
import { TextInput, TextInputWithUnits } from '../../components/editor/elements';
import { ArgsAccount, ArgsBig, ArgsError, ArgsObject, ArgsString, ArgsBool } from "../../utils/args";
import { Call } from "../../utils/call";
import { toGas, formatTokenAmount, unitToDecimals } from "../../utils/converter";
import { view } from "../../utils/wallet";
import BaseTask from "../base";
import debounce from "lodash.debounce";
import "./near.scss";


export default class StorageDeposit extends BaseTask {

    uniqueClassName = "near-storage-deposit-task";
    errors = {
        ...this.baseErrors,
        addr: new ArgsError("Invalid address", value => ArgsAccount.isValid(value)),
        func: new ArgsError("Cannot be empty", value => value != ""),
        args: new ArgsError("Invalid JSON", value => true),
        gas: new ArgsError("Amount out of bounds", value => ArgsBig.isValid(value)),
        account: new ArgsError("Invalid address", value => ArgsAccount.isValid(value), true),
        noToken: new ArgsError("Address does not belong to token contract", value => this.errors.noToken),
        paid: new ArgsError("Account already paid storage deposit for this token", value => this.errors.paid)
    };

    updateFTDebounced = debounce(() => this.updateFT(), 500);

    constructor(props) {

        super(props);

        this.updateFT();

    }

    init(json = null) {

        const actions = json?.actions?.[0];

        this.call = new Call({
            name: new ArgsString(json?.name ?? "Storage Deposit"),
            addr: new ArgsAccount(json?.address ?? window.nearConfig.WNEAR_ADDRESS),
            func: new ArgsString(actions?.func ?? "storage_deposit"),
            args: new ArgsObject(actions?.args 
                ? {
                    account_id: new ArgsAccount(actions.args.account_id),
                    registration_only: new ArgsBool(true)
                }
                : {
                    account_id: new ArgsAccount(""),
                    registration_only: new ArgsBool(true)
                }    
            ),
            gas: new ArgsBig("8", null, null, "Tgas"),
            depo: new ArgsBig("0.0125", null, null, "NEAR")
        });
        
        this.loadErrors = (() => {

            for (let e in this.baseErrors)
                this.errors[e].validOrNull(this.call[e])

            this.errors.account.validOrNull(this.call.args.value.account_id);

            this.updateFT();

        }).bind(this)


    }

    updateFT() {

        const { addr, args } = this.call;
        const { account_id } = args.value;

        this.errors.noToken.isBad = false;
        this.errors.paid.isBad = false;

        if (this.errors.addr.isBad || this.errors.account.isBad)
            return;

        view(
            addr.value,
            "storage_balance_of",
            {account_id: account_id.value}
        )
        .catch(e => {
            if (e.type === "AccountDoesNotExist" || e.toString().includes("MethodNotFound"))
                this.errors.noToken.isBad = true;
            else if (!e.toString().includes("The account ID is invalid"))
                throw e;
        })
        .then((storage) => {
            this.errors.paid.isBad = storage !== null;
            this.updateCard();
        })

    }

    renderEditor() {

        const {
            name,
            addr,
        } = this.call;

        const {
            account_id
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
                    label="Token address"
                    value={ addr }
                    error={[ errors.addr, errors.noToken ]}
                    update={ () => {
                        this.updateCard();
                        this.updateFTDebounced();
                    } }
                />
                <TextInput 
                    label="Receiver address"
                    value={ account_id }
                    error={[ errors.account, errors.paid ]}
                    update={ () => {
                        this.updateCard();
                        this.updateFTDebounced();
                    } }
                />
            </div>
        );

    }

}