import { InputAdornment } from '@mui/material';
import React from 'react';
import { TextInput, TextInputWithUnits } from '../../components/editor/elements';
import { ArgsAccount, ArgsBig, ArgsBool, ArgsError, ArgsObject, ArgsString } from "../../utils/args";
import Call from "../../utils/call";
import { toGas, formatTokenAmount, unitToDecimals, toYocto } from "../../utils/converter";
import { view } from "../../utils/wallet";
import BaseTask from "../base";
import debounce from "lodash.debounce";
import "./near.scss";


export default class Transfer extends BaseTask {

    uniqueClassName = "near-transfer-task";
    errors = {
        ...this.baseErrors,
        addr: new ArgsError("Invalid address", value => ArgsAccount.isValid(value)),
        func: new ArgsError("Cannot be empty", value => value != ""),
        args: new ArgsError("Invalid JSON", value => true),
        receiver: new ArgsError("Invalid address", value => ArgsAccount.isValid(value), !ArgsAccount.isValid(this.calls[1].args.value.receiver_id)),
        amount: new ArgsError("Amount out of bounds", value => ArgsBig.isValid(value)),
        gas: new ArgsError("Amount out of bounds", value => ArgsBig.isValid(value)),
        noToken: new ArgsError("Address does not belong to token contract", value => this.errors.noToken)
    };

    updateFTDebounced = debounce(() => this.updateFT(), 500);

    constructor(props) {

        super(props);

        window.WALLET.then(() => this.updateFT());

    }

    init(json = null) {

        const actions = json?.actions;
        const units = json?.units?.actions;

        // if json only has action, its the ft_transfer, not storage_deposit.
        if (actions?.length === 1) {
            actions[1] = actions[0];
            actions[0] = {};
            units[1] = units[0];
            units[0] = {};
        }

        this.calls = [new Call({
            name: new ArgsString(json?.name ?? "FT Transfer"),
            addr: new ArgsAccount(json?.address ?? window.nearConfig.WNEAR_ADDRESS),
            func: new ArgsString("storage_deposit"),
            args: new ArgsObject(actions?.[1]?.args
                ? {
                    account_id: new ArgsAccount(actions?.[1].args.receiver_id),
                    registration_only: true
                }
                : {
                    account_id: new ArgsAccount(""),
                    registration_only: new ArgsBool(true)
                }
            ),
            gas: new ArgsBig("8", null, null, "Tgas"),
            depo: new ArgsBig("0.0125", null, null, "NEAR") 
        }),
        new Call({
            name: new ArgsString(json?.name ?? "FT Transfer"),
            addr: new ArgsAccount(json?.address ?? window.nearConfig.WNEAR_ADDRESS),
            func: new ArgsString(actions?.[1]?.func ?? "ft_transfer"),
            args: new ArgsObject(actions?.[1]?.args 
                ? {
                    receiver_id: new ArgsAccount(actions?.[1].args.receiver_id),
                    amount: new ArgsBig(
                        formatTokenAmount(actions?.[1].args.amount, units?.[1].args.amount.decimals),
                        "0",
                        null,
                        units?.[1].args.amount?.[1].unit,
                        units?.[1].args.amount?.[1].decimals
                    ),
                    memo: new ArgsString(actions?.[1].args.memo)
                }
                : {
                    receiver_id: new ArgsAccount(""),
                    amount: new ArgsBig("0", "0", null, "yocto"),
                    memo: new ArgsString("")
                }    
            ),
            gas: new ArgsBig(
                formatTokenAmount(actions?.[1]?.gas ?? toGas("10"), units?.[1]?.gas.decimals ?? unitToDecimals["Tgas"]),
                toGas("1"), 
                toGas("300"), 
                units?.[1]?.gas?.unit ?? "Tgas",
                units?.[1]?.gas?.decimals
            ),
            depo: new ArgsBig("1", "1", "1", "yocto")
        })];
        
        this.loadErrors = (() => {

            for (let e in this.baseErrors)
                this.errors[e].validOrNull(this.calls[1][e])

            this.errors.receiver.validOrNull(this.calls[1].args.value.receiver_id);
            this.errors.amount.validOrNull(this.calls[1].args.value.amount);

            WALLET.then(() => this.updateFT());

        }).bind(this)


    }

    updateFT() {

        const { addr, args } = this.calls[1];
        const { amount, receiver_id } = args.value;

        this.errors.noToken.isBad = false;

        if (this.errors.addr.isBad)
            return;

        Promise.all([
            view(
                addr.value,
                "ft_metadata",
                {}
            )
            .catch(e => {
                if (e.type === "AccountDoesNotExist" || e.toString().includes("MethodNotFound"))
                    this.errors.noToken.isBad = true;
            }),
            view(
                addr.value,
                "storage_balance_of",
                {account_id: receiver_id.value}
            )
            .catch(e => {
                if (!e.toString().includes("The account ID is invalid"))
                    throw e;
            })
        ])
        .then(([metadata, storage]) => {
            if (metadata) {
                amount.unit = metadata.symbol;
                amount.decimals = metadata.decimals;
            }
            this.calls[0].omit = storage !== null;
            this.updateCard();
        })

    }

    renderEditor() {

        const {
            name,
            addr,
            gas
        } = this.calls[1];

        const {
            account_id
        } = this.calls[0].args.value;

        const {
            receiver_id,
            amount,
            memo
        } = this.calls[1].args.value;

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
                    value={ receiver_id }
                    error={ errors.receiver }
                    update={ () => {
                        account_id.value = receiver_id.value;
                        this.updateCard();
                        this.updateFTDebounced();
                    } }
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