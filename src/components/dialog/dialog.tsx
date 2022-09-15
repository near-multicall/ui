import {
    Dialog as MUIDialog,
    DialogTitle as MUIDialogTitle,
    DialogContent as MUIDialogContent,
    DialogActions as MUIDialogAction,
} from "@mui/material";
import { clsx } from "clsx";
import React, { Component, useEffect, useState } from "react";

import "./dialog.scss";

interface DialogProps extends React.PropsWithChildren {
    cancelRename?: string;
    className?: string;
    doneRename?: string;
    noSubmit?: boolean;
    onCancel?: VoidFunction;
    onClose?: VoidFunction;
    onDone?: VoidFunction;
    open: boolean;
    title: string;
}

export const Dialog = ({
    cancelRename,
    children,
    className,
    doneRename,
    noSubmit,
    onCancel,
    onClose,
    onDone,
    open,
    title,
}: DialogProps) => (
    <MUIDialog
        onClose={() => onClose?.()}
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
                        onClose?.();
                    }}
                >
                    {cancelRename ?? "Cancel"}
                </button>
            ) : null}

            {onDone !== undefined ? (
                <button
                    className={clsx("done", { disabled: noSubmit })}
                    disabled={noSubmit}
                    onClick={() => {
                        onDone();
                        onClose?.();
                    }}
                >
                    {doneRename ?? "Done"}
                </button>
            ) : null}
        </MUIDialogAction>
    </MUIDialog>
);
