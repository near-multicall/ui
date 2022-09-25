import {
    Dialog as MUIDialog,
    DialogTitle as MUIDialogTitle,
    DialogContent as MUIDialogContent,
    DialogActions as MUIDialogActions,
} from "@mui/material";
import { clsx } from "clsx";
import { PropsWithChildren } from "react";

import "./index.scss";

interface DialogProps extends PropsWithChildren {
    cancelRename?: string;
    className?: string;
    doneRename?: string;
    noCancel?: boolean;
    noSubmit?: boolean;
    onCancel?: VoidFunction;
    onClose?: VoidFunction;
    onSubmit?: VoidFunction;
    open: boolean;
    title: string;
}

export const Dialog = ({
    cancelRename,
    children,
    className,
    doneRename,
    noCancel = false,
    noSubmit,
    onCancel,
    onClose,
    onSubmit,
    open,
    title,
}: DialogProps) => (
    <MUIDialog
        className={clsx("dialog", className)}
        {...{ onClose, open }}
    >
        <MUIDialogTitle className="title">{title}</MUIDialogTitle>
        <MUIDialogContent className="content">{children}</MUIDialogContent>

        <MUIDialogActions className="action">
            {!noCancel ? (
                <button
                    className="cancel"
                    onClick={() => {
                        onCancel?.();
                        onClose?.();
                    }}
                >
                    {cancelRename || "Cancel"}
                </button>
            ) : null}

            <button
                className={clsx("done", { disabled: noSubmit })}
                disabled={noSubmit}
                onClick={() => {
                    onSubmit?.();
                    onClose?.();
                }}
            >
                {doneRename || "Done"}
            </button>
        </MUIDialogActions>
    </MUIDialog>
);
