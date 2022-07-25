import { InputAdornment } from '@mui/material';
import React from 'react';
import { TextInput, TextInputWithUnits } from '../../components/editor/elements';
import { ArgsAccount, ArgsBig, ArgsError, ArgsObject, ArgsString } from "../../utils/args";
import { Call } from "../../utils/call";
import { toGas, formatTokenAmount, unitToDecimals } from "../../utils/converter";
import { view } from "../../utils/wallet";
import debounce from "lodash.debounce";
import "./near.scss";
import BatchTask from '../batch';


export default class Transfer extends BatchTask {

    uniqueClassName = "near-transfer-task";
    errors = {
        ...this.baseErrors,
        noToken: new ArgsError("Address does not belong to token contract", value => this.errors.noToken)
    };

    updateFTDebounced = debounce(() => this.updateFT(), 500);

    constructor(props) {

        super(props);

        this.updateFT();
        
    }

    init(json = null) {

        this.state = {
            ...this.state,
            name: new ArgsString(json?.name ?? "FT transfer"),
            addr: new ArgsAccount(json?.address ?? window.nearConfig.WNEAR_ADDRESS)
        };
        
        this.loadErrors = (() => {

            for (let e in this.baseErrors)
                this.errors[e].validOrNull(this.state[e])

            this.errors.noToken.validOrNull(this.state.addr);

            this.updateFT();

        }).bind(this)


    }

    static inferOwnType(json) {
        // TODO check if address is token address, note requires promise.all in tasks
        return !!json && json.actions[0].func === "ft_transfer"
    }

    updateFT() {

        const { addr } = this.state;

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
        // .then(res => {
        //     if (res) {
        //         if (amount.decimals === null) {
        //             amount.value = formatTokenAmount(amount.value, res.decimals);
        //         }
        //         amount.unit = res.symbol;
        //         amount.decimals = res.decimals;
        //     }
        //     this.updateCard()
        // })

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