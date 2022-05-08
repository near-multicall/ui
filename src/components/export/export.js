import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { InputAdornment } from '@mui/material';
import Checkbox from '@mui/material/Checkbox';
import Icon from '@mui/material/Icon';
import TextField from '@mui/material/TextField';
import { Base64 } from 'js-base64';
import React, { Component } from 'react';
import { ArgsAccount, ArgsBig, ArgsError, ArgsNumber, ArgsString } from '../../utils/args';
import { convert, toGas } from '../../utils/converter';
import { view } from "../../utils/wallet";
import { TextInput, TextInputWithUnits } from '../editor/elements';
import './export.scss';

export default class Export extends Component {

    errors = {
        user: new ArgsError("Invalid address", value => ArgsAccount.isValid(value), true),
        dao: new ArgsError("Invalid address", value => ArgsAccount.isValid(value), true),
        multicall: new ArgsError("Invalid address", value => ArgsAccount.isValid(value), true),
        gas: new ArgsError("Amount out of bounds", value => ArgsNumber.isValid(value)),
        depo: new ArgsError("Amount out of bounds", value => ArgsBig.isValid(value) && value.value !== ""),
        amount: new ArgsError("Invalid amount", value => ArgsBig.isValid(value) && value.value !== ""),
        token: new ArgsError("Invalid address", value => ArgsAccount.isValid(value)),
        desc: new ArgsError("Invalid proposal description", value => value.value !== "", true),
        noToken: new ArgsError("Address does not belong to token contract", value => this.errors.noToken)
    };

    total = {
        gas: new ArgsNumber(toGas(270), 1, toGas(270), "gas"),
        depo: new ArgsBig("1", "1", null, "yocto"),
        desc: new ArgsString("")
    }

    ft = {
        amount: new ArgsBig("1", "1", null, "yocto"),
        token: new ArgsAccount(window.nearConfig.WNEAR_ADDRESS)
    }

    attachFTs = false;
    showArgs = false;

    lastInput;

    constructor(props) {

        super(props);

        this.update = this.update.bind(this);
        window.WALLET.then(() => this.updateFT());

    }

    updateCopyIcon(e) {

        if (e.target.innerHTML === 'done')
            return;

        const oldIcon = e.target.innerHTML;
        e.target.innerHTML = 'done';

        setTimeout(() => {
            e.target.innerHTML = oldIcon;
        }, 1000);
        
    }

    toggleShowArgs() {

        this.showArgs = !this.showArgs;
        this.forceUpdate();

    }

    update() {

        this.forceUpdate();

    }

    updateFT() {

        const { token, amount } = this.ft;

        this.errors.noToken.isBad = false;

        if (this.errors.token.isBad)
            return;

        view(
            token.value,
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
            this.update()
        })

    }

    render() {

        const LAYOUT = this.props.layout; // ususally global parameter

        const { gas, depo, desc } = this.total;
        const { amount, token } = this.ft;

        const allErrors = LAYOUT.toErrors();
        const errors = this.errors;

        const walletError = window?.WALLET?.errors 
            ? Object.entries(WALLET.errors).filter(([k, v]) => v.isBad)[0]?.[1].message
            : null

        const addresses = Object.fromEntries(Object.entries(STORAGE.addresses)
            .map(([k, v]) => {
                const account = new ArgsAccount(v)
                errors[k].validOrNull(account);
                return [k, account]
            }));

        return (
            <div 
                value={2}
                className="tab-panel"
            >
                <div className="export-container">

                    <div className="input-container">
                        <TextInput 
                            label="Proposal description"
                            value={ desc }
                            error={ errors.desc }
                            multiline
                            update={ this.update }
                        />
                        <TextInputWithUnits 
                            label="Total allocated gas"
                            value={ gas }
                            error={ errors.gas }
                            options={[ "gas", "Tgas" ]}
                            update={ this.update }
                        />
                        <TextInputWithUnits 
                            label="Total attached deposit"
                            value={ depo }
                            error={ errors.depo }
                            options={[ "yocto", "NEAR" ]}
                            update={ this.update }
                        />
                        <div className="checkbox">
                            <Checkbox
                                checked={ this.attachFTs }
                                onChange={e => {
                                    this.attachFTs = e.target.checked;
                                    this.update();
                                }}
                            />
                            <p>Attach FTs to multicall</p>
                        </div>
                        { this.attachFTs
                            ? <>
                                <TextField
                                    label="Amount"
                                    value={ errors.amount.validOrNull(amount) || errors.amount.intermediate }
                                    margin="dense"
                                    size="small"
                                    onChange={(e) => {
                                        amount.value = e.target.value;
                                        errors.amount.validOrNull(amount);
                                        this.update();
                                    }}
                                    error={errors.amount.isBad}
                                    helperText={errors.amount.isBad && errors.amount.message}
                                    InputLabelProps={{ shrink: true }}
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end">{amount.unit}</InputAdornment>,
                                    }}
                                />
                                <TextInput
                                    label="Token contract"
                                    value={ token }
                                    error={[ errors.token, errors.noToken ]}
                                    update={ () => {
                                        this.update();
                                        setTimeout(() => {
                                            if (new Date() - this.lastInput > 400)
                                                this.updateFT()
                                        }, 500)
                                        this.lastInput = new Date()
                                    } }
                                />
                            </>
                            : <></>
                        }
                    </div>
                    { allErrors.length > 0 && <div className="error-container">
                        <div className="header">
                            <h3>{`Errors (${allErrors.length})`}</h3>
                        </div>
                        <div className="error-list">
                            { allErrors.map((e, i) => 
                                <div className="error" key={`error-${i}`}>
                                    <p className="msg">
                                        {`[${e.task.call.name}] Error: ${e.message}`}
                                    </p>
                                    <EditOutlinedIcon 
                                        className="icon" 
                                        onClick={ () => {
                                            EDITOR.edit(e.task.props.id);
                                            MENU.changeTab(1);
                                        } }
                                    />
                                </div>
                            ) }
                        </div>
                    </div> }
                    <div className="section">
                        <div className="header">
                            <Icon 
                                className="icon collapse"
                                onClick={ () => this.toggleShowArgs() }
                                collapsed={ this.showArgs ? "no" : "yes" }
                            >expand_more</Icon> 
                            <h3
                                onClick={ () => this.toggleShowArgs() }
                            >Multicall args</h3>
                            { this.showArgs 
                                ? <Icon 
                                    className="icon copy"
                                    onClick={ e => {
                                        navigator.clipboard.writeText(JSON.stringify({calls: LAYOUT.toBase64()}));
                                        this.updateCopyIcon(e); 
                                    } }
                                >content_copy</Icon>
                                : <></>
                            }
                        </div>
                        { this.showArgs 
                            ? <div className="value">
                                <pre className="code">
                                    { !this.attachFTs
                                        ? JSON.stringify({calls: LAYOUT.toBase64()}) 
                                        : JSON.stringify({
                                            receiver_id: STORAGE.addresses.multicall, 
                                            amount: amount.value,
                                            msg: JSON.stringify({
                                                function_id: "multicall",
                                                args: Base64.encode(JSON.stringify({"calls":LAYOUT.toBase64()}).toString())
                                            }).toString()
                                        })
                                    }
                                </pre>
                            </div>
                            : <></>
                        }
                    </div>
                    <div className="spacer"></div>
                    { WALLET?.state?.wallet.isSignedIn() 
                        ? <button 
                            className="propose button"
                            disabled={
                                errors.dao.isBad
                                || errors.multicall.isBad
                                || errors.depo.isBad
                                || errors.desc.isBad
                                || (this.attachFTs && (errors.amount.isBad || errors.token.isBad))
                                || walletError
                            }
                            onClick={() => {
                                if (this.attachFTs)
                                    WALLET.proposeFT(desc.value, convert(depo.value, depo.unit), convert(gas.value, gas.unit), token.value, amount.value)
                                else
                                    WALLET.propose(desc.value, convert(depo.value, depo.unit), convert(gas.value, gas.unit))
                            }}
                        >
                            {`Propose on ${STORAGE.addresses.dao}`}
                            { walletError ? <p>{ walletError }</p> : <></> }
                        </button>
                    : <button 
                        className="login button"
                        onClick={() => WALLET.signIn()}
                    >
                        Connect to Wallet
                    </button>
                    }
                </div>
            </div>
        );

    }

}