import {
    Dialog as MUIDialog,
    DialogTitle as MUIDialogTitle,
    DialogContent as MUIDialogContent,
    DialogActions as MUIDialogAction,
} from "@mui/material";
import { clsx } from "clsx";
import React, { Component } from "react";

import "./dialog.scss";

interface DialogProps extends React.PropsWithChildren {
    cancelRename: string;
    disable: () => boolean;
    doneRename: string;
    className: string;
    onClose: VoidFunction;
    onDone: VoidFunction;
    onCancel: VoidFunction;
    open: boolean;
    title: string;
}

export const Dialog = ({
    cancelRename,
    children,
    disable,
    doneRename,
    className,
    onClose,
    onDone,
    onCancel,
    open,
    title,
}: DialogProps) => (
    <MUIDialog
        onClose={() => onClose()}
        open={open}
        className={clsx("dialog", className)}
    >
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
                    className={clsx("done", { disabled: disable?.() })}
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
