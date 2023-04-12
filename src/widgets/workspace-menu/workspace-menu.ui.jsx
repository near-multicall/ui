import Icon from "@mui/material/Icon";
import clsx from "clsx";
import { Component } from "react";

import { Task } from "../../entities";
import { WorkspaceBuilder, WorkspaceEditor, WorkspaceExport } from "../../features";
import { Tabs } from "../../shared/ui/design";

import "./workspace-menu.ui.scss";

export class WorkspaceMenu extends Component {
    constructor(props) {
        super(props);

        this.state = {
            expanded: false,
            activeTabIndex: 0,
        };

        document.addEventListener("onaddressesupdated", () => this.forceUpdate());
    }

    componentDidMount() {
        window.MENU = this;
    }

    activeTabSwitch = (newTabIndex) => this.setState({ activeTabIndex: newTabIndex });

    render() {
        const { activeTabIndex, expanded } = this.state;

        /** Usually global parameter */
        const LAYOUT = this.props.layout;

        return (
            <div className={`WorkspaceMenu ${expanded ? "WorkspaceMenu--expanded" : ""}`}>
                <div className="WorkspaceMenu-tabs">
                    <Tabs
                        invertedColors
                        activeItemIndexOverride={activeTabIndex}
                        activeItemSwitchOverride={this.activeTabSwitch}
                        classes={{
                            root: "WorkspaceMenu-tabs",
                            buttonsPanel: "WorkspaceMenu-tabs-buttonsPanel",
                            contentSpace: "WorkspaceMenu-tabs-contentSpace",
                        }}
                        items={[
                            {
                                name: "Build",
                                ui: (
                                    <WorkspaceBuilder
                                        layout={LAYOUT}
                                        menu={this}
                                    />
                                ),
                            },
                            {
                                name: "Edit",
                                ui: <WorkspaceEditor />,
                            },
                            {
                                name: "Export",
                                ui: <WorkspaceExport layout={LAYOUT} />,
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
