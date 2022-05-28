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
import { readFile, saveFile } from '../../utils/loader';
import Dialog from '../dialog/dialog';
import './sidebar.scss';
export default class Sidebar extends Component {

    constructor(props) {

        super(props);

        this.state = {
            dialogs: {
                saveAsJSON: false,
                loadFromJSON: false
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
                <li>Load from Proposal <Chip label="coming soon!"/></li>
                <li>Load from Link <Chip label="coming soon!"/></li>
            </ul>
        </div>

    }

    render() {

        return (
            <div className="sidebar-wrapper">
                <div className="sidebar-container">
                    <div className="title">
                        <Icon className="logo">dynamic_feed</Icon>
                        <span className="env" env={window.ENVIRONMENT}>
                            <ScienceOutlinedIcon className="icon"/>
                        </span>
                    </div>
                    <nav>
                        <NavLink className={({ isActive }) => isActive ? "active" : ""} to="/app">App</NavLink>
                        <NavLink className={({ isActive }) => isActive ? "active" : ""} to="/dao">Dao</NavLink>
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
                    <img src={Twitter} onClick={() => window.open('https://twitter.com/near_multicall')}/>
                    <img src={Discord} onClick={() => window.open('https://discord.gg/wc6T6bPvdr')}/>
                    <img src={Github} onClick={() => window.open('https://github.com/near-multicall')}/>
                    {/* <img src={Telegram}/> */}
                    <Wallet/>
                </div>
                { this.dialogs() }
            </div>
        );

    }

    dialogs() {

        const { dialogs } = this.state;

        let fileName = "my-multicall";
        let uploadedFile;

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
                onDone={() => saveFile(`${fileName}.json`, [JSON.stringify(LAYOUT.toJSON(), null, 2)])}
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
                onDone={() => readFile(uploadedFile, json => LAYOUT.fromJSON(json))}
                doneRename="Load"
            >
                <input 
                    accept=".json,application/JSON"
                    type="file"
                    onChange={(e) => uploadedFile = e.target.files[0]}
                />
                <br/>
                <b className="warn">Your current multicall will be replaced!</b>
            </Dialog>
        ]
    }

}