import {
    DeleteForeverOutlined,
    FileDownloadOutlined,
    FileUploadOutlined,
    LinkOutlined,
    ScienceOutlined,
} from "@mui/icons-material";

import { Chip, Icon, IconButton, TextField, Tooltip } from "@mui/material";
import { Base64 } from "js-base64";
import React, { Component, createElement as h } from "react";
import { NavLink } from "react-router-dom";
import { map } from "lodash";

import Discord from "../../assets/discord.svg";
import Github from "../../assets/github.svg";
import Twitter from "../../assets/twitter.svg";
import { Wallet } from "../../components";
import Dialog from "../dialog/dialog";
import { TextInput } from "../editor/elements";
import { STORAGE } from "../../utils/persistent";
import { SputnikDAO } from "../../utils/contracts/sputnik-dao";
import { ArgsError, ArgsString } from "../../utils/args";
import { readFile, saveFile } from "../../utils/loader";
import "./sidebar.scss";

const PopupMenu = ({ Icon, items }) => (
    <div className="popup-menu sidebar-button">
        {Icon}

        <div className="popup-menu-content">
            <ul>
                {map(items, ({ label, onClick, title }) =>
                    h("li", { key: title, onClick }, title, label && h(Chip, { label }))
                )}
            </ul>
        </div>
    </div>
);

const DAPP_LOGIN_METHODS = [
    { key: "daoDappLogin", title: "Login in dApp as DAO" },
    { key: "multicallDappLogin", title: "Login in dApp as Multicall" },
];

const DappLoginInstructions = () => (
    <ul style={{ listStyleType: "auto" }}>
        <li>Go to the dApp website you want to use</li>
        <li>Log out your current wallet</li>
        <li>Copy the dApp URL</li>
        <li>Paste the URL in an input field below</li>
        <li>Click "Proceed" to continue</li>
    </ul>
);

const DappLoginDialog = ({ onClose, open, title }) => {
    const dappURL = new ArgsString("");
    const invalidDappURL = new ArgsError("Invalid URL", (urlInput) => urlInput !== "test", true);

    return (
        <Dialog
            className="modal-dialog"
            onCancel={() => {}}
            onDone={() => {}}
            doneRename="Proceed"
            disable={() => invalidDappURL.isBad}
            {...{ onClose, open, title }}
        >
            <DappLoginInstructions />

            <TextInput
                label="dApp URL"
                value={dappURL}
                error={invalidDappURL}
                update={(event, textInputComponent) => {}}
                variant="filled"
                className="light-textfield"
            />
        </Dialog>
    );
};

export default class Sidebar extends Component {
    constructor(props) {
        super(props);

        this.state = {
            dialogs: {
                saveAsJSON: false,
                loadFromJSON: false,
                loadFromProposal: false,
                clearAll: false,
                daoDappLogin: false,
                multicallDappLogin: false,
            },
        };
    }

    componentDidMount() {
        window.SIDEBAR = this;
    }

    openDialog(name) {
        this.setState({ dialogs: { ...this.state.dialogs, [name]: true } });
    }

    dialogClose(name) {
        this.setState({ dialogs: { [name]: false } });
        this.forceUpdate();
    }

    dialogs() {
        const { dialogs } = this.state;
        const dialogComponent = React.createRef();

        // Load from JSON
        let fileName = "my-multicall";
        let uploadedFile;

        // Load from Proposal
        const proposalURL = new ArgsString("");
        const proposalURLInvalid = new ArgsError(
            "Invalid URL",
            (urlInput) => !!SputnikDAO.getInfoFromProposalUrl(urlInput.value),
            true
        );

        const proposalNonExistent = new ArgsError(
            "The specified URL does not link to a proposal",
            (urlInput) => proposalNonExistent.isBad
        );

        let argsFromProposal;

        return [
            ...map(DAPP_LOGIN_METHODS, ({ key, title }) =>
                h(DappLoginDialog, {
                    key,
                    onClose: () => this.dialogClose(key),
                    open: dialogs[key],
                    title,
                })
            ),

            <Dialog
                className="modal-dialog"
                key="Save as JSON"
                title="Save as JSON"
                open={dialogs.saveAsJSON}
                onClose={() => this.dialogClose("saveAsJSON")}
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
                className="modal-dialog"
                key="Load from JSON"
                title="Load from JSON"
                open={dialogs.loadFromJSON}
                onClose={() => this.dialogClose("loadFromJSON")}
                onCancel={() => {}}
                onDone={() => readFile(uploadedFile, (json) => LAYOUT.fromBase64(json))}
                doneRename="Load"
            >
                <input
                    accept=".json,application/JSON"
                    type="file"
                    onChange={(e) => (uploadedFile = e.target.files[0])}
                />

                <b className="warn">Your current multicall will be replaced!</b>
            </Dialog>,

            <Dialog
                className="modal-dialog"
                key="Load from Proposal"
                title="Load from Proposal"
                open={dialogs.loadFromProposal}
                onClose={() => this.dialogClose("loadFromProposal")}
                onCancel={() => {}}
                onDone={() => window.LAYOUT.fromBase64(argsFromProposal)}
                doneRename="Load"
                disable={() => proposalURLInvalid.isBad || proposalNonExistent.isBad}
                ref={dialogComponent}
            >
                <TextInput
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
                />

                <p>Enter proposal link from AstroDAO or base UI</p>
                <b className="warn">Your current multicall will be replaced!</b>
            </Dialog>,

            <Dialog
                className="modal-dialog"
                key="Clear All"
                title="Clear All"
                open={dialogs.clearAll}
                onClose={() => this.dialogClose("clearAll")}
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

    render() {
        return (
            <div className="sidebar-wrapper">
                <div className="sidebar-container">
                    <div className="title">
                        <Icon className="logo">dynamic_feed</Icon>

                        <span className="env" env={window.NEAR_ENV}>
                            <ScienceOutlined className="icon" />
                        </span>
                    </div>

                    <nav>
                        <NavLink className={({ isActive }) => (isActive ? "active" : "")} to="/app">
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

                    <PopupMenu
                        Icon={<LinkOutlined />}
                        items={map(DAPP_LOGIN_METHODS, ({ key, title }) => ({
                            onClick: () => this.openDialog(key),
                            title,
                        }))}
                    />

                    {window.PAGE === "app" ? (
                        <>
                            <PopupMenu
                                Icon={<FileDownloadOutlined />}
                                items={[
                                    {
                                        onClick: () => this.openDialog("saveAsJSON"),
                                        title: "Save as JSON",
                                    },
                                    {
                                        title: "Share as Link",
                                        label: "coming soon!",
                                    },
                                ]}
                            />

                            <PopupMenu
                                Icon={<FileUploadOutlined />}
                                items={[
                                    {
                                        onClick: () => this.openDialog("loadFromJSON"),
                                        title: "Load from JSON",
                                    },
                                    {
                                        onClick: () => this.openDialog("loadFromProposal"),
                                        title: "Load from Proposal",
                                    },
                                    /*
                                    {
                                        title: "Load from Link",
                                        label: "coming soon!",
                                    },
                                    */
                                ]}
                            />

                            <div className="popup-menu sidebar-button">
                                <Tooltip title={<h1 style={{ fontSize: "12px" }}>Clear All</h1>} placement="right">
                                    <IconButton
                                        disableRipple
                                        className="sidebar-button"
                                        onClick={() => this.openDialog("clearAll")}
                                    >
                                        <DeleteForeverOutlined />
                                    </IconButton>
                                </Tooltip>
                            </div>
                        </>
                    ) : null}
                    <hr />

                    <a target="_blank" rel="noopener noreferrer" href="https://twitter.com/near_multicall">
                        <img src={Twitter} alt="Twitter" />
                    </a>
                    <a target="_blank" rel="noopener noreferrer" href="https://discord.gg/wc6T6bPvdr">
                        <img src={Discord} alt="Discord" />
                    </a>
                    <a target="_blank" rel="noopener noreferrer" href="https://github.com/near-multicall">
                        <img src={Github} alt="Github" />
                    </a>

                    {/* <img src={Telegram}/> */}
                    <Wallet />
                </div>

                {this.dialogs()}
            </div>
        );
    }
}
