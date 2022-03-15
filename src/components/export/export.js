import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import Checkbox from '@mui/material/Checkbox';
import Icon from '@mui/material/Icon';
import TextField from '@mui/material/TextField';
import { Base64 } from 'js-base64';
import React, { Component } from 'react';
import { ArgsAccount, ArgsBig, ArgsError, ArgsNumber, ArgsString } from '../../utils/args';
import { toGas } from '../../utils/converter';
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
        token: new ArgsError("Invalid address", value => ArgsAccount.isValid(value))
    };

    total = {
        gas: new ArgsNumber(toGas(270), 0, toGas(270), "gas"),
        depo: new ArgsBig("1", "1", null, "yocto"),
        desc: new ArgsString("")
    }

    ft = {
        amount: new ArgsBig("1", "1", null, "yocto"),
        token: new ArgsAccount(window.nearConfig.WNEAR_ADDRESS)
    }

    attachFTs = false;

    constructor(props) {

        super(props);

        this.update = this.update.bind(this);

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

    update() {

        this.forceUpdate();

    }

    render() {

        const LAYOUT = this.props.layout; // ususally global parameter

        const { gas, depo, desc } = this.total;
        const { amount, token } = this.ft;

        const allErrors = LAYOUT.toErrors();
        const errors = this.errors;

        const addresses = Object.fromEntries(Object.entries(LAYOUT.state.addresses)
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
                            label="DAO address"
                            value={ addresses.dao }
                            error={ errors.dao }
                            update={e => {
                                LAYOUT.setAddresses({
                                    dao: e.target.value
                                });
                                this.forceUpdate();
                            }}
                        />
                        <TextInput
                            label="Multicall address"
                            value={ addresses.multicall }
                            error={ errors.multicall }
                            update={e => {
                                LAYOUT.setAddresses({
                                    multicall: e.target.value
                                });
                                this.forceUpdate();
                            }}
                        />
                    </div>
                    <div className="input-container">
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
                                />
                                <TextInput
                                    label="Token contract"
                                    value={ token }
                                    error={ errors.token }
                                    update={ this.update }
                                />
                            </>
                            : <></>
                        }
                        <TextInput 
                            label="Proposal description"
                            value={ desc }
                            multiline
                            update={ this.update }
                        />
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
                    { !this.attachFTs 
                        ?
                            <div className="section">
                                <div className="header">
                                    <h3>Multicall args</h3>
                                    <Icon 
                                        className="icon"
                                        onClick={ e => {
                                            navigator.clipboard.writeText(JSON.stringify({calls: LAYOUT.toBase64()}));
                                            this.updateCopyIcon(e); 
                                        } }
                                    >content_copy</Icon> 
                                </div>
                                <div className="value">
                                    <pre className="code">
                                        { JSON.stringify({calls: LAYOUT.toBase64()}) }
                                    </pre>
                                </div>
                            </div>
                        : <></>    
                    }
                    { window?.WALLET?.state?.wallet.isSignedIn() ?
                        <button 
                            className="propose button"
                            disabled={
                                errors.dao.isBad
                                || errors.multicall.isBad
                                || errors.depo.isBad
                                || (this.attachFTs && (errors.amount.isBad || errors.token.isBad))
                            }
                            onClick={() => {
                                if (this.attachFTs)
                                    WALLET.proposeFT(desc.value, depo.value, gas.value, token.value, amount.value)
                                else
                                    WALLET.propose(desc.value, depo.value, gas.value)
                            }}
                        >
                            {`Propose on ${LAYOUT.state.addresses.dao}`}
                        </button>
                    :
                        <button 
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