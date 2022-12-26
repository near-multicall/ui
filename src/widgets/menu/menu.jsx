import Icon from "@mui/material/Icon";
import clsx from "clsx";
import { Component } from "react";

import { Tabs } from "../../shared/ui/design";
import { Builder } from "../builder/builder.jsx";
import { Editor } from "../editor/editor.jsx";
import { Export } from "../export/export";
import "./menu.scss";

export class Menu extends Component {
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
            <div className={`Menu ${expanded ? "Menu--expanded" : ""}`}>
                <div className="Menu-tabs">
                    <Tabs
                        invertedColors
                        activeItemIndexOverride={activeTabIndex}
                        activeItemSwitchOverride={this.activeTabSwitch}
                        classes={{
                            root: "Menu-tabs",
                            buttonsPanel: "Menu-tabs-buttonsPanel",
                            contentSpace: "Menu-tabs-contentSpace",
                        }}
                        items={[
                            {
                                name: "Build",
                                ui: (
                                    <Builder
                                        layout={LAYOUT}
                                        menu={this}
                                    />
                                ),
                            },
                            {
                                name: "Edit",
                                ui: <Editor />,
                            },
                            {
                                name: "Export",
                                ui: <Export layout={LAYOUT} />,
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
