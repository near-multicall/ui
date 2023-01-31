import {
    Dialog as MUIDialog,
    DialogTitle as MUIDialogTitle,
    DialogContent as MUIDialogContent,
    DialogActions as MUIDialogActions,
} from "@mui/material";
import { clsx } from "clsx";
import { PropsWithChildren } from "react";

import { Button } from "../button";

import "./dialog.scss";

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
        className={clsx("Dialog", className)}
        {...{ onClose, open }}
    >
        <MUIDialogTitle className="Dialog-title">{title}</MUIDialogTitle>
        <MUIDialogContent className="Dialog-content">{children}</MUIDialogContent>

        <MUIDialogActions className="Dialog-actions">
            <Button
                color="error"
                disabled={noCancel}
                label={cancelRename ?? "Cancel"}
                noRender={noCancel}
                onClick={() => {
                    onCancel?.();
                    onClose?.();
                }}
            />

            <Button
                color="success"
                disabled={noSubmit}
                label={doneRename ?? "Done"}
                onClick={() => {
                    onSubmit?.();
                    onClose?.();
                }}
            />
        </MUIDialogActions>
    </MUIDialog>
);
