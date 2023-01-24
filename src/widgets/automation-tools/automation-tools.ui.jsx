import Icon from "@mui/material/Icon";
import clsx from "clsx";
import { Component } from "react";

import { TaskTemplates } from "../../entities";
import { EditTask, ProposeAutomation } from "../../features";
import { Tabs } from "../../shared/ui/design";

import "./automation-tools.ui.scss";

export class AutomationToolsUI extends Component {
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
            <div className={`AutomationTools ${expanded ? "AutomationTools--expanded" : ""}`}>
                <div className="AutomationTools-tabs">
                    <Tabs
                        invertedColors
                        activeItemIndexOverride={activeTabIndex}
                        activeItemSwitchOverride={this.activeTabSwitch}
                        classes={{
                            root: "AutomationTools-tabs",
                            buttonsPanel: "AutomationTools-tabs-buttonsPanel",
                            contentSpace: "AutomationTools-tabs-contentSpace",
                        }}
                        items={[
                            {
                                name: "Build",
                                ui: (
                                    <TaskTemplates
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
                                ui: <ProposeAutomation.UI layout={LAYOUT} />,
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
