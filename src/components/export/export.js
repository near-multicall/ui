import React, { Component } from 'react';
import Icon from '@mui/material/Icon';
import './export.scss';

export default class Export extends Component {

    render() {

        const LAYOUT = this.props.layout; // ususally global parameter

        console.log("editor updated");

        return (
            <div 
                value={2}
                className="tab-panel"
            >
                <div className="section">
                    <div className="header">
                        <h3>JSON</h3>
                        <Icon 
                            className="icon"
                            onClick={ () => navigator.clipboard.writeText(JSON.stringify(LAYOUT.toJSON())) }
                        >content_copy</Icon> 
                    </div>
                    <div className="value">
                        <pre className="code">
                            { JSON.stringify(LAYOUT.toJSON()) }
                        </pre>
                    </div>
                </div>
                <div className="section">
                    <div className="header">
                        <h3>Base64</h3>
                        <Icon 
                            className="icon"
                            onClick={ () => navigator.clipboard.writeText(JSON.stringify(LAYOUT.toBase64())) }
                        >content_copy</Icon> 
                    </div>
                    <div className="value">
                        <pre className="code">
                            { JSON.stringify(LAYOUT.toBase64()) }
                        </pre>
                    </div>
                </div>
                <div className="section">
                    <div className="header">
                        <h3>Near CLI</h3>
                        <Icon 
                            className="icon"
                            onClick={ () => navigator.clipboard.writeText(LAYOUT.toCLI()) }
                        >content_copy</Icon> 
                    </div>
                    <div className="value">
                        <pre className="code">
                            { LAYOUT.toCLI() }
                        </pre>
                    </div>
                </div>
            </div>
        );

    }

}