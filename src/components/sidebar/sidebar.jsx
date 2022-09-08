import {
    DeleteForeverOutlined,
    FileDownloadOutlined,
    FileUploadOutlined,
    PreviewOutlined,
    ScienceOutlined,
} from "@mui/icons-material";

import { Icon } from "@mui/material";
import React, { Component } from "react";
import { NavLink } from "react-router-dom";

import Discord from "../../assets/discord.svg";
import Github from "../../assets/github.svg";
import Twitter from "../../assets/twitter.svg";
import { Wallet } from "../wallet/wallet.jsx";
import { STORAGE } from "../../utils/persistent";
import { PopupMenu } from "../popup-menu/popup-menu.jsx";

import {
    DappLoginDialog,
    LoadFromJsonDialog,
    LoadFromProposalDialog,
    SaveAsJsonDialog,
    ClearAllDialog,
} from "./dialogs.jsx";

import "./sidebar.scss";

const DAPP_LOGIN_METHODS = {
    dao: { actorType: "dao", key: "daoDappLogin", title: "Login in dApps as DAO" },
    multicall: { actorType: "multicall", key: "multicallDappLogin", title: "Login in dApps as Multicall" },
};

export class Sidebar extends Component {
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

    closeDialog(name) {
        this.setState({ dialogs: { ...this.state.dialogs, [name]: false } });
        this.forceUpdate();
    }

    dialogs() {
        const { dialogs } = this.state;

        return [
            ...Object.values(DAPP_LOGIN_METHODS).map((props) => (
                <DappLoginDialog
                    onClose={() => this.closeDialog(props.key)}
                    open={dialogs[props.key]}
                    {...props}
                />
            )),

            <SaveAsJsonDialog
                key="saveAsJSON"
                onClose={() => this.closeDialog("saveAsJSON")}
                open={dialogs.saveAsJSON}
            />,

            <LoadFromJsonDialog
                key="loadFromJSON"
                onClose={() => this.closeDialog("loadFromJSON")}
                open={dialogs.loadFromJSON}
            />,

            <LoadFromProposalDialog
                key="loadFromProposal"
                onClose={() => this.closeDialog("loadFromProposal")}
                open={dialogs.loadFromProposal}
            />,

            <ClearAllDialog
                key="clearAll"
                onClose={() => this.closeDialog("clearAll")}
                open={dialogs.clearAll}
            />,
        ];
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
                            <ScienceOutlined className="icon" />
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

                    <PopupMenu
                        icon={<PreviewOutlined />}
                        items={Object.values(DAPP_LOGIN_METHODS).map(({ key, title }) => ({
                            onClick: () => this.openDialog(key),
                            title,
                        }))}
                        triggerClassName="sidebar-button"
                    />
                    <hr />

                    {window.PAGE === "app" ? (
                        <>
                            <PopupMenu
                                icon={<FileDownloadOutlined />}
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
                                triggerClassName="sidebar-button"
                            />

                            <PopupMenu
                                icon={<FileUploadOutlined />}
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
                                triggerClassName="sidebar-button"
                            />

                            <PopupMenu
                                icon={<DeleteForeverOutlined onClick={() => this.openDialog("clearAll")} />}
                                items={[
                                    {
                                        onClick: () => this.openDialog("clearAll"),
                                        title: "Clear All",
                                    },
                                ]}
                                triggerClassName="sidebar-button"
                            />

                            <hr />
                        </>
                    ) : null}

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
}
