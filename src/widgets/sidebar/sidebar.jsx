import {
    DeleteForeverOutlined,
    FileDownloadOutlined,
    FileUploadOutlined,
    PreviewOutlined,
    ScienceOutlined,
} from "@mui/icons-material";

import { Icon } from "@mui/material";
import { Component } from "react";
import { NavLink } from "react-router-dom";

import Discord from "../../app/static/discord.svg";
import Github from "../../app/static/github.svg";
import Twitter from "../../app/static/twitter.svg";
import { Wallet } from "../../entities/wallet";
import { DappLogin } from "../../features";
import { STORAGE } from "../../shared/lib/persistent";
import { viewAccount } from "../../shared/lib/wallet";
import { PopupMenu, Tooltip } from "../../shared/ui/components";

import { LoadFromJsonDialog, LoadFromProposalDialog, SaveAsJsonDialog, ClearAllDialog } from "./dialogs.jsx";

import "./sidebar.scss";

export class Sidebar extends Component {
    constructor(props) {
        super(props);

        this.state = {
            FeatureFlags: {
                initialized: false,

                DappLogin: {
                    [DappLogin.METHODS.dao.type]: true,
                    [DappLogin.METHODS.multicall.type]: false,
                },
            },

            dialogs: {
                saveAsJSON: false,
                loadFromJSON: false,
                loadFromProposal: false,
                clearAll: false,
            },
        };
    }

    static walletContext = Wallet.useSelector();

    featureFlagsCalc() {
        viewAccount(STORAGE.addresses.multicall)
            .then(() =>
                this.setState({
                    FeatureFlags: {
                        ...this.state.FeatureFlags,
                        initialized: true,

                        DappLogin: {
                            ...this.state.FeatureFlags.DappLogin,
                            [DappLogin.METHODS.multicall.type]: true,
                        },
                    },
                })
            )
            .catch(() =>
                this.setState({
                    FeatureFlags: {
                        ...this.state.FeatureFlags,
                        initialized: true,

                        DappLogin: {
                            ...this.state.FeatureFlags.DappLogin,
                            [DappLogin.METHODS.multicall.type]: false,
                        },
                    },
                })
            );
    }

    componentDidMount() {
        window.SIDEBAR = this;
        document.addEventListener("onaddressesupdated", () => this.featureFlagsCalc());
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

                    <DappLogin.Menu
                        FeatureFlags={this.state.FeatureFlags}
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
                                        disabled: true,
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

                            <div className="sidebar-button">
                                <Tooltip
                                    placement="right"
                                    title="Clear All"
                                >
                                    <DeleteForeverOutlined
                                        className="icon"
                                        onClick={() => this.openDialog("clearAll")}
                                    />
                                </Tooltip>
                            </div>

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
                    <Wallet.Selector />
                </div>

                {this.dialogs()}
            </div>
        );
    }
}
