import Icon from "@mui/material/Icon";
import clsx from "clsx";
import { Component } from "react";

import { Task } from "../../entities";
import { EditTask, WorkflowExport } from "../../features";
import { Tabs } from "../../shared/ui/design";

import "./workflow-editor.ui.scss";

export class WorkflowEditorMenu extends Component {
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
            <div className={`WorkflowEditorMenu ${expanded ? "WorkflowEditorMenu--expanded" : ""}`}>
                <div className="WorkflowEditorMenu-tabs">
                    <Tabs
                        invertedColors
                        activeItemIndexOverride={activeTabIndex}
                        activeItemSwitchOverride={this.activeTabSwitch}
                        classes={{
                            root: "WorkflowEditorMenu-tabs",
                            buttonsPanel: "WorkflowEditorMenu-tabs-buttonsPanel",
                            contentSpace: "WorkflowEditorMenu-tabs-contentSpace",
                        }}
                        items={[
                            {
                                name: "Build",
                                ui: (
                                    <Task.CardsList
                                        layout={LAYOUT}
                                        menu={this}
                                    />
                                ),
                            },
                            {
                                name: "Edit",
                                ui: <EditTask.UI />,
                            },
                            {
                                name: "Export",
                                ui: <WorkflowExport.UI layout={LAYOUT} />,
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
