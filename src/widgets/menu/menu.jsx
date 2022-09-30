import Icon from "@mui/material/Icon";
import clsx from "clsx";
import { Component } from "react";

import { Tabs } from "../../shared/ui/components";
import { Builder } from "../builder/builder.jsx";
import { Editor } from "../editor/editor.jsx";
import { Export } from "../export/export.jsx";
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
                            buttonsPanel: "Menu-tabs-buttonsPanel",
                            contentSpace: "Menu-tabs-contentSpace",
                        }}
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
