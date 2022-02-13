import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { ArgsError, ArgsAccount } from '../../utils/args';
import Icon from '@mui/material/Icon';
import TextField from '@mui/material/TextField';
import React, { Component } from 'react';
import './export.scss';

export default class Export extends Component {

    errors = {
        user: new ArgsError("Invalid address", value => ArgsAccount.isValid(value), true),
        dao: new ArgsError("Invalid address", value => ArgsAccount.isValid(value), true),
        multicall: new ArgsError("Invalid address", value => ArgsAccount.isValid(value), true)
    };

    updateCopyIcon(e) {

        if (e.target.innerHTML === 'done')
            return;

        const oldIcon = e.target.innerHTML;
        e.target.innerHTML = 'done';

        setTimeout(() => {
            e.target.innerHTML = oldIcon;
        }, 1000);
        
    }

    render() {

        const LAYOUT = this.props.layout; // ususally global parameter

        const allErrors = LAYOUT.toErrors();
        const errors = this.errors;

        for (let e in errors)
            errors[e].validOrNull(LAYOUT.state.addresses[e]);

        return (
            <div 
                value={2}
                className="tab-panel"
            >
                <div className="export-container">
                    <div className="input-container">
                        <TextField
                            label="User address"
                            value={ LAYOUT.state.addresses.user }
                            margin="dense"
                            size="small"
                            onChange={e => {
                                LAYOUT.setAddresses({
                                    user: e.target.value
                                });
                                errors.user.validOrNull(e.target.value);
                                this.forceUpdate();
                            }}
                            error={errors.user.isBad}
                            helperText={errors.user.isBad && errors.user.message}
                            InputLabelProps={{shrink: true}}
                        />
                        <TextField
                            label="DAO address"
                            value={ LAYOUT.state.addresses.dao }
                            margin="dense"
                            size="small"
                            onChange={e => {
                                LAYOUT.setAddresses({
                                    dao: e.target.value
                                });
                                errors.dao.validOrNull(e.target.value);
                                this.forceUpdate();
                            }}
                            error={errors.dao.isBad}
                            helperText={errors.dao.isBad && errors.dao.message}
                            InputLabelProps={{shrink: true}}
                        />
                        <TextField
                            label="Multicall address"
                            value={ LAYOUT.state.addresses.multicall }
                            margin="dense"
                            size="small"
                            onChange={e => {
                                LAYOUT.setAddresses({
                                    multicall: e.target.value
                                });
                                errors.multicall.validOrNull(e.target.value);
                                this.forceUpdate();
                            }}
                            error={errors.multicall.isBad}
                            helperText={errors.multicall.isBad && errors.multicall.message}
                            InputLabelProps={{shrink: true}}
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
                    <div className="section">
                        <div className="header">
                            <h3>Near CLI</h3>
                            <Icon 
                                className="icon"
                                onClick={ (el) => {
                                    navigator.clipboard.writeText(LAYOUT.toCLI());
                                    this.updateCopyIcon(el);
                                } }
                            >content_copy</Icon> 
                        </div>
                        <div className="value">
                            <pre className="code">
                                { LAYOUT.toCLI() }
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        );

    }

}