import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import { Chip, Icon, TextField } from '@mui/material';
import React, { Component } from 'react';
import { NavLink } from "react-router-dom";
import Discord from '../../assets/discord.svg';
import Github from '../../assets/github.svg';
import Twitter from '../../assets/twitter.svg';
import { Wallet } from '../../components';
import { ArgsError, ArgsString } from '../../utils/args';
import { readFile, saveFile } from '../../utils/loader';
import Dialog from '../dialog/dialog';
import { TextInput } from '../editor/elements';
import './sidebar.scss';
export default class Sidebar extends Component {

    constructor(props) {

        super(props);

        this.state = {
            dialogs: {
                saveAsJSON: false,
                loadFromJSON: false,
                loadFromProposal: false,
            }
        }
    }

    componentDidMount() {

        window.SIDEBAR = this;

    }

    openDialog(name) {

        const newDialogs = {...this.state.dialogs};
        newDialogs[name] = true;

        this.setState({ dialogs: newDialogs })

    }

    saveMenu() {

        return <div className="save-menu">
            <ul>
                <li onClick={ () => this.openDialog("saveAsJSON") }>Save as JSON</li>
                <li>Share as Link <Chip label="coming soon!"/></li>
            </ul>
        </div>

    }

    loadMenu() {

        return <div className="load-menu">
            <ul>
                <li onClick={ () => this.openDialog("loadFromJSON") }>Load from JSON</li>
                <li onClick={ () => this.openDialog("loadFromProposal") }>Load from Proposal</li>
                {/* <li>Load from Link <Chip label="coming soon!"/></li> */}
            </ul>
        </div>

    }

    render() {

        return (
            <div className="sidebar-wrapper">
                <div className="sidebar-container">
                    <div className="title">
                        <Icon className="logo">dynamic_feed</Icon>
                        <span className="env" env={window.NEAR_ENV}>
                            <ScienceOutlinedIcon className="icon"/>
                        </span>
                    </div>
                    <nav>
                        <NavLink 
                            className={({ isActive }) => isActive ? "active" : ""} 
                            to="/app"
                        >
                            App
                        </NavLink>
                        <NavLink 
                            className={({ isActive }) => isActive ? "active" : ""} 
                            to="/dao"
                            onClick={() => window.STORAGE.save()}
                        >
                            Dao
                        </NavLink>
                    </nav>
                    <hr/>
                    { window.PAGE === "app"
                      ? <>
                            <div className="save">
                                <FileDownloadOutlinedIcon/>
                                { this.saveMenu() }
                            </div>
                            <div className="load">
                                <FileUploadOutlinedIcon/>
                                { this.loadMenu() }
                            </div>
                        </>
                      : null
                    }
                    <hr/>
                    <a target="_blank" rel="noopener noreferrer" href='https://twitter.com/near_multicall'>
                        <img src={Twitter} alt="Twitter"/>
                    </a>
                    <a target="_blank" rel="noopener noreferrer" href='https://discord.gg/wc6T6bPvdr'>
                        <img src={Discord} alt="Discord"/>
                    </a>
                    <a target="_blank" rel="noopener noreferrer" href='https://github.com/near-multicall'>
                        <img src={Github} alt="Github"/>
                    </a>
                    {/* <img src={Telegram}/> */}
                    <Wallet/>
                </div>
                { this.dialogs() }
            </div>
        );

    }

    dialogs() {

        const { dialogs } = this.state;

        // Load from JSON
        let fileName = "my-multicall";
        let uploadedFile;

        // Load from Proposal
        const validProposalURLRegex = /^(https:\/\/)?((testnet\.)?app\.astrodao\.com\/dao\/((?=[^\/]{2,64}\/)(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+)\/proposals\/\4\-\d+)|((testnet\-)?v2\.sputnik\.fund\/#\/((?=[^\/]{2,64}\/)(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+)\/\d+)$/;
        const proposalURL = new ArgsString("");
        const proposalURLInvalid = new ArgsError("Invalid URL", value => validProposalURLRegex.test(value));
        const proposalNonExistent = new ArgsError("The specified URL does not link to a proposal", value => proposalNonExistent);

        return [
            <Dialog 
                key="Save as JSON"
                title="Save as JSON"
                open={dialogs.saveAsJSON}
                onClose={() => {
                    dialogs.saveAsJSON = false;
                    this.forceUpdate();
                }}
                onCancel={() => {}}
                onDone={() => saveFile(`${fileName}.json`, [JSON.stringify(LAYOUT.toBase64(), null, 2)])}
                doneRename="Download"
            >
                <TextField
                    label="Multicall title"
                    defaultValue="my-multicall"
                    variant="filled"
                    className="light-textfield"
                    helperText="Please give a name to your multicall"
                    onChange={(e) => fileName = e.target.value}
                />
            </Dialog>,
            <Dialog
                key="Load from JSON"
                title="Load from JSON"
                open={dialogs.loadFromJSON}
                onClose={() => {
                    dialogs.loadFromJSON = false;
                    this.forceUpdate();
                }}
                onCancel={() => {}}
                onDone={() => readFile(uploadedFile, json => LAYOUT.fromBase64(json))}
                doneRename="Load"
            >
                <input 
                    accept=".json,application/JSON"
                    type="file"
                    onChange={(e) => uploadedFile = e.target.files[0]}
                />
                <br/>
                <b className="warn">Your current multicall will be replaced!</b>
            </Dialog>,
            <Dialog
                key="Load from Proposal"
                title="Load from Proposal"
                open={dialogs.loadFromProposal}
                onClose={() => {
                    dialogs.loadFromProposal = false;
                    this.forceUpdate();
                }}
                onCancel={() => {}}
                onDone={() => {/* TODO fetch and load proposal json, during load and on fail set proposalNonExistent to bad */}}
                doneRename="Load"
                disable={proposalURLInvalid.isBad || proposalNonExistent.isBad}
            >
                <TextInput
                    label="Proposal URL"
                    value={ proposalURL }
                    error={[ proposalURLInvalid, proposalNonExistent ]}
                    variant="filled"
                    className="light-textfield"
                />
                <br/>
                <p>Enter a SputnikDAO or AstroDAO proposal link</p>
            </Dialog>
        ]
    }

}