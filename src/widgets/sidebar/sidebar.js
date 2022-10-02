import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import DeleteForeverOutlinedIcon from "@mui/icons-material/DeleteForeverOutlined";
import { Chip, Icon, TextField } from "@mui/material";
import React, { Component } from "react";
import { NavLink } from "react-router-dom";
import Discord from "../../assets/discord.svg";
import Github from "../../assets/github.svg";
import Twitter from "../../assets/twitter.svg";
import { Wallet } from "../../components";
import { STORAGE } from "../../utils/persistent";
import { SputnikDAO } from "../../utils/contracts/sputnik-dao";
import { args } from "../../utils/args/args";
import { Base64 } from "js-base64";
import { readFile, saveFile } from "../../utils/loader";
import Dialog from "../dialog/dialog";
import { TextInput } from "../editor/elements";
import "./sidebar.scss";
export default class Sidebar extends Component {
    constructor(props) {
        super(props);

        this.state = {
            dialogs: {
                saveAsJSON: false,
                loadFromJSON: false,
                loadFromProposal: false,
                clearAll: false,
            },
        };
    }

    componentDidMount() {
        window.SIDEBAR = this;
    }

    openDialog(name) {
        const newDialogs = { ...this.state.dialogs };
        newDialogs[name] = true;

        this.setState({ dialogs: newDialogs });
    }

    saveMenu() {
        return (
            <div className="save-menu">
                <ul>
                    <li onClick={() => this.openDialog("saveAsJSON")}>Save as JSON</li>
                    <li>
                        Share as Link <Chip label="coming soon!" />
                    </li>
                </ul>
            </div>
        );
    }

    loadMenu() {
        return (
            <div className="load-menu">
                <ul>
                    <li onClick={() => this.openDialog("loadFromJSON")}>Load from JSON</li>
                    <li onClick={() => this.openDialog("loadFromProposal")}>Load from Proposal</li>
                    {/* <li>Load from Link <Chip label="coming soon!"/></li> */}
                </ul>
            </div>
        );
    }

    render() {
        return (
            <div className="sidebar-wrapper">
                <div className="sidebar-container">
                    <div className="title">
                        <Icon className="logo">dynamic_feed</Icon>
                        <span
                            className="env"
                            env={window.NEAR_ENV}
                        >
                            <ScienceOutlinedIcon className="icon" />
                        </span>
                    </div>
                    <nav>
                        <NavLink
                            className={({ isActive }) => (isActive ? "active" : "")}
                            to="/app"
                        >
                            App
                        </NavLink>
                        <NavLink
                            className={({ isActive }) => (isActive ? "active" : "")}
                            to="/dao"
                            onClick={() => STORAGE.save()}
                        >
                            Dao
                        </NavLink>
                    </nav>
                    <hr />
                    {window.PAGE === "app" ? (
                        <>
                            <div className="save">
                                <FileDownloadOutlinedIcon />
                                {this.saveMenu()}
                            </div>
                            <div className="load">
                                <FileUploadOutlinedIcon />
                                {this.loadMenu()}
                            </div>
                            <div className="clear">
                                <DeleteForeverOutlinedIcon onClick={() => this.openDialog("clearAll")} />
                            </div>
                        </>
                    ) : null}
                    <hr />
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href="https://twitter.com/near_multicall"
                    >
                        <img
                            src={Twitter}
                            alt="Twitter"
                        />
                    </a>
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href="https://discord.gg/wc6T6bPvdr"
                    >
                        <img
                            src={Discord}
                            alt="Discord"
                        />
                    </a>
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href="https://github.com/near-multicall"
                    >
                        <img
                            src={Github}
                            alt="Github"
                        />
                    </a>
                    {/* <img src={Telegram}/> */}
                    <Wallet />
                </div>
                {this.dialogs()}
            </div>
        );
    }

    dialogs() {
        const { dialogs } = this.state;
        const dialogComponent = React.createRef();

        // Load from JSON
        let fileName = "my-multicall";
        let uploadedFile;

        // Load from Proposal
        const proposalURL = "";
        const proposalURLInvalid = args
            .string()
            .url("URL invalid")
            .test({
                name: "proposalUrl",
                message: "URL does not belong to a proposal",
                test: (value) => value == null || !!SputnikDAO.getInfoFromProposalUrl(value),
            })
            .retain({ initial: true });
        let argsFromProposal;

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
                    onChange={(e) => (fileName = e.target.value)}
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
                onDone={() => readFile(uploadedFile, (json) => LAYOUT.fromBase64(json))}
                doneRename="Load"
            >
                <input
                    accept=".json,application/JSON"
                    type="file"
                    onChange={(e) => (uploadedFile = e.target.files[0])}
                />
                <br />
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
                onDone={() => {
                    window.LAYOUT.fromBase64(argsFromProposal);
                }}
                doneRename="Load"
                disable={() => proposalURLInvalid.isBad() /*|| proposalNonExistent.isBad*/}
                ref={dialogComponent}
            >
                {/* <TextInput
                    label="Proposal URL"
                    value={proposalURL}
                    error={[proposalURLInvalid, proposalNonExistent]}
                    update={(e, textInputComponent) => {
                        // don't fetch proposal info from bad URL.
                        if (proposalURLInvalid.isBad) {
                            proposalNonExistent.isBad = false;
                            return;
                        }
                        const { dao, proposalId } = SputnikDAO.getInfoFromProposalUrl(proposalURL.value);
                        // !!! creating SputnikDAO instance must be done using init() to make sure DAO exists
                        // on that address. We use constructor here because of previous logic checks.
                        const daoObj = new SputnikDAO(dao);
                        // fetch proposal info from DAO contract
                        daoObj
                            .getProposal(proposalId)
                            .catch((e) => {
                                proposalNonExistent.isBad = true;
                                return;
                            })
                            .then((propOrUndefined) => {
                                if (!!propOrUndefined) {
                                    let multicallArgs;
                                    const currProposal = propOrUndefined.kind?.FunctionCall;
                                    const multicallAction = currProposal?.actions.find((action) => {
                                        // is it normal multicall?
                                        if (action.method_name === "multicall") {
                                            multicallArgs = JSON.parse(Base64.decode(action.args));
                                            return true;
                                        }
                                        // is it multicall with attached FT?
                                        else if (action.method_name === "ft_transfer_call") {
                                            const ftTransferArgs = JSON.parse(Base64.decode(action.args));
                                            const ftTransferMsg = JSON.parse(ftTransferArgs.msg);
                                            if (
                                                ftTransferMsg.function_id &&
                                                ftTransferMsg.function_id === "multicall"
                                            ) {
                                                multicallArgs = JSON.parse(Base64.decode(ftTransferMsg.args));
                                                return true;
                                            }
                                        }
                                    });
                                    if (multicallAction) {
                                        proposalNonExistent.isBad = false;
                                        argsFromProposal = multicallArgs.calls;
                                    }
                                }
                                textInputComponent.forceUpdate();
                                dialogComponent.current.forceUpdate();
                            });
                        dialogComponent.current.forceUpdate();
                    }}
                    variant="filled"
                    className="light-textfield"
                /> */}
                <br />
                <p>Enter proposal link from AstroDAO or base UI</p>
                <b className="warn">Your current multicall will be replaced!</b>
            </Dialog>,
            <Dialog
                key="Clear All"
                title="Clear All"
                open={dialogs.clearAll}
                onClose={() => {
                    dialogs.clearAll = false;
                    this.forceUpdate();
                }}
                onCancel={() => {}}
                onDone={() => LAYOUT.clear()}
                doneRename="Yes, clear all"
            >
                <b className="warn">
                    Are you sure you want to clear your multicall?
                    <br />
                    You cannot undo this action!
                </b>
            </Dialog>,
        ];
    }
}
