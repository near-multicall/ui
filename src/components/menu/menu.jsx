import React, { Component } from "react";
import Icon from "@mui/material/Icon";
import { Builder } from "../builder/builder.jsx";
import { Editor } from "../editor/editor.jsx";
import { Export } from "../export/export.jsx";
import "./menu.scss";
import clsx from "clsx";

export class Menu extends Component {
    constructor(props) {
        super(props);

        this.state = {
            expanded: false,
            activeTab: 0,
        };

        document.addEventListener("onaddressesupdated", () => this.forceUpdate());
    }

    componentDidMount() {
        window.MENU = this;
    }

    changeTab = (newTab) => this.setState({ activeTab: newTab });

    render() {
        const { expanded, activeTab } = this.state;

        const LAYOUT = this.props.layout; // ususally global parameter

        return (
            <div className={`menu-container ${expanded ? "expanded-menu" : ""}`}>
                <div className="EditorTabs-root">
                    <div className="Tab-buttons">
                        <button
                            className={clsx("tab", { "is-active": activeTab === 0 })}
                            onClick={() => this.changeTab(0)}
                        >
                            Build
                        </button>

                        <button
                            className={clsx("tab", { "is-active": activeTab === 1 })}
                            onClick={() => this.changeTab(1)}
                        >
                            Edit
                        </button>

                        <button
                            className={clsx("tab", { "is-active": activeTab === 2 })}
                            onClick={() => this.changeTab(2)}
                        >
                            Export
                        </button>
                    </div>

                    <div className={clsx("Tab-panel", { active: activeTab === 0 })}>
                        <Builder
                            layout={LAYOUT}
                            menu={this}
                        />
                    </div>

                    <div className={clsx("Tab-panel", { active: activeTab === 1 })}>
                        <Editor />
                    </div>

                    <div className={clsx("Tab-panel", { active: activeTab === 2 })}>
                        <Export layout={LAYOUT} />
                    </div>

                    <div className={clsx("toggle-size", { collapse: expanded, expand: !expanded })}>
                        <Icon
                            className="icon"
                            onClick={() => {
                                LAYOUT.setExpanded(!expanded);
                                this.setState({ expanded: !expanded });
                            }}
                        >
                            navigate_before
                        </Icon>
                    </div>
                </div>
            </div>
        );
    }
}
