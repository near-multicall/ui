import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import Icon from '@mui/material/Icon';
import TextField from '@mui/material/TextField';
import React, { Component } from 'react';
import './export.scss';

export default class Export extends Component {

    updateCopyIcon(el) {

        if (el.target.innerHTML === 'done')
            return;

        const oldIcon = el.target.innerHTML;
        el.target.innerHTML = 'done';

        setTimeout(() => {
            el.target.innerHTML = oldIcon;
        }, 1000);
        
    }

    render() {

        const LAYOUT = this.props.layout; // ususally global parameter

        const errors = LAYOUT.toErrors();

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
                                this.forceUpdate();
                            }}
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
                                this.forceUpdate();
                            }}
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
                                this.forceUpdate();
                            }}
                            InputLabelProps={{shrink: true}}
                        />
                    </div>
                    { errors.length > 0 && <div className="error-container">
                        <div className="header">
                            <h3>{`Errors (${errors.length})`}</h3>
                        </div>
                        <div className="error-list">
                            { errors.map((e, i) => 
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
                                onClick={ (el) => {
                                    navigator.clipboard.writeText(JSON.stringify({schedules: LAYOUT.toBase64()}));
                                    this.updateCopyIcon(el); 
                                } }
                            >content_copy</Icon> 
                        </div>
                        <div className="value">
                            <pre className="code">
                                { JSON.stringify({schedules: LAYOUT.toBase64()}) }
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