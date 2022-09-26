import {
    Dialog as MuiDialog,
    DialogTitle as MuiDialogTitle,
    DialogContent as MuiDialogContent,
    DialogActions as MuiDialogAction,
    DialogProps as MuiDialogProps,
} from "@mui/material";
import { clsx } from "clsx";
import { Component } from "react";

import "./index.scss";

interface DialogProps extends MuiDialogProps {
    cancelRename?: string;
    disable: () => boolean;
    doneRename?: string;
    onClose: VoidFunction;
    onCancel: VoidFunction;
    onDone: VoidFunction;
}

interface DialogState {
    open: DialogProps["open"];
    title: DialogProps["title"];
}

export class Dialog extends Component<DialogProps, DialogState> {
    constructor(props: DialogProps) {
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
            <MuiDialog
                className={clsx("dialog", className)}
                {...{ onClose, open }}
            >
                <MuiDialogTitle className="title">{title}</MuiDialogTitle>
                <MuiDialogContent className="content">{children}</MuiDialogContent>
                <MuiDialogAction className="action">
                    {onCancel !== undefined ? (
                        <button
                            className="cancel"
                            onClick={() => {
                                onCancel();
                                onClose?.();
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
                </MuiDialogAction>
            </MuiDialog>
        );
    }
}
