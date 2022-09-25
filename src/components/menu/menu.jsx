import React, { Component } from "react";
import Icon from "@mui/material/Icon";
import { Builder } from "../builder/builder.jsx";
import { Editor } from "../editor/editor.jsx";
import { Export } from "../export/export.jsx";
import { Tabs } from "../../shared/ui/components/tabs/index.tsx";
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
        const { expanded } = this.state;

        const LAYOUT = this.props.layout; // ususally global parameter

        return (
            <div className={`menu-container ${expanded ? "expanded-menu" : ""}`}>
                <div className="EditorTabs-root">
                    <Tabs
                        classes={{ buttonsPanel: "Tab-buttons", contentSpace: "Tab-panel" }}
                        items={[
                            {
                                title: "Build",
                                content: (
                                    <Builder
                                        layout={LAYOUT}
                                        menu={this}
                                    />
                                ),
                            },
                            {
                                title: "Edit",
                                content: <Editor />,
                            },
                            {
                                title: "Export",
                                content: <Export layout={LAYOUT} />,
                            },
                        ]}
                    />

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
