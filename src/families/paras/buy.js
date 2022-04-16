import { TextField } from '@mui/material';
import React from 'react';
import { TextInput, TextInputWithUnits } from '../../components/editor/elements';
import { ArgsAccount, ArgsBig, ArgsError, ArgsNumber, ArgsString, ArgsObject, ArgsArray } from "../../utils/args";
import Call from "../../utils/call";
import { toGas } from "../../utils/converter";
import BaseTask from "../base";
import "./paras.scss";

export default class Buy extends BaseTask {

    uniqueClassName = "paras-buy-task";
    errors = {
        ...this.baseErrors,
        url: new ArgsError("Invalid URL", value => this.isParasURL(value.value)),
        args: new ArgsError("Invalid JSON", value => true),
    };

    init(json = null) {

        const actions = json?.actions?.[0];

        this.call = new Call({
            name: new ArgsString(json?.name ?? "Buy NFT"),
            addr: new ArgsAccount(json?.address ?? window.nearConfig.PARAS_MARKETPLACE_ADDRESS),
            func: new ArgsString(actions?.func ?? "buy"),
            args: new ArgsObject(actions?.args 
                ? {
                    nft_contract_id: new ArgsAccount(actions.args.nft_contract_id),
                    token_id: new ArgsString(actions.args.token_id),
                    url: new ArgsString(actions.args?.url ?? `https://paras.id/token/${actions.args.nft_contract_id}::${actions.args.token_id.split(":")[0]}/${actions.args.token_id}`)
                }
                : {
                    nft_contract_id: new ArgsAccount(""),
                    token_id: new ArgsString(""),
                    url: new ArgsString("")
                }    
            ),
            gas: new ArgsNumber(actions?.gas ?? 0, 0, toGas(300), "gas"),
            depo: new ArgsBig(actions?.depo ?? "0", "0", null, "yocto")
        });

        this.call.args.value.url.omit = true;
    }

    isParasURL(URL) {

        const accountValid = ArgsAccount.isValid(this.URLToContractID(URL));
        return /^https\:\/\/paras\.id\/token\/[^\/]*\:\:\d+(\/\d+:?\d*|)$/.test(URL) && accountValid

    }

    URLToContractID(URL) {

        return URL.match(/\/([^\/]+)\:\:/)?.[1] ?? "";

    }

    URLToTokenID(URL) {

        return URL.match(/\/(\d+:?\d*)$/)?.[1] ?? URL.match(/\:\:(\d+)($|\/)/)?.[1] ?? "";

    }

    renderEditor() {

        const {
            name,
            gas,
            depo,
        } = this.call;

        const {
            nft_contract_id,
            token_id,
            url
        } = this.call.args.value;

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
                    label="NFT URL"
                    value={ url }
                    error={ errors.url }
                    update={ (e) => {
                        console.log(url, errors.url, this.isParasURL(e.target.value));
                        nft_contract_id.value = this.URLToContractID(url.value)
                        token_id.value = this.URLToTokenID(url.value)
                        this.updateCard() 
                    }}
                />
                <TextInputWithUnits 
                    label="Allocated gas"
                    value={ gas }
                    error={ errors.gas }
                    options={[ "gas", "Tgas" ]}
                    update={ this.updateCard }
                />
                <TextInputWithUnits 
                    label="Attached deposit"
                    value={ depo }
                    error={ errors.depo }
                    options={[ "yocto", "NEAR" ]}
                    update={ this.updateCard }
                />
            </div>
        );

    }

}