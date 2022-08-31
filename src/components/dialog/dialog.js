import {
    Dialog as MUIDialog,
    DialogTitle as MUIDialogTitle,
    DialogContent as MUIDialogContent,
    DialogActions as MUIDialogAction,
} from "@mui/material";
import { clsx } from "clsx";
import React, { Component } from "react";

import "./dialog.scss";

export default class Dialog extends Component {
    constructor(props) {
        super(props);

        this.state = {
            open: this.props.open,
            title: this.props.title,
        };
    }

    componentDidUpdate() {
        if (!this.state.open && this.props.open) this.setState({ open: true });
        else if (this.state.open && !this.props.open) this.setState({ open: false });
    }

    render() {
        const { title, open } = this.state;
        const { className, onClose, onDone, doneRename, onCancel, cancelRename, disable, children } = this.props;

        return (
            <MUIDialog onClose={() => onClose()} open={open} className={clsx("dialog", className)}>
                <MUIDialogTitle className="title">{title}</MUIDialogTitle>
                <MUIDialogContent className="content">{children}</MUIDialogContent>
                <MUIDialogAction className="action">
                    {onCancel !== undefined ? (
                        <button
                            className="cancel"
                            onClick={() => {
                                onCancel();
                                onClose();
                            }}
                        >
                            {cancelRename ?? "Cancel"}
                        </button>
                    ) : null}
                    {onDone !== undefined ? (
                        <button
                            className={`done ${disable?.() ? "disabled" : ""}`}
                            onClick={() => {
                                if (disable?.()) return;
                                onDone();
                                onClose();
                            }}
                        >
                            {doneRename ?? "Done"}
                        </button>
                    ) : null}
                </MUIDialogAction>
            </MUIDialog>
        );
    }
}
