import {
    Dialog as MUIDialog,
    DialogTitle as MUIDialogTitle,
    DialogContent as MUIDialogContent,
    DialogActions as MUIDialogActions,
} from "@mui/material";
import { clsx } from "clsx";
import { PropsWithChildren } from "react";

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

const _Dialog = "Dialog";

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
        className={clsx(_Dialog, className)}
        {...{ onClose, open }}
    >
        <MUIDialogTitle className={`${_Dialog}-title`}>{title}</MUIDialogTitle>
        <MUIDialogContent className={`${_Dialog}-content`}>{children}</MUIDialogContent>

        <MUIDialogActions className={`${_Dialog}-actions`}>
            {!noCancel ? (
                <button
                    className={clsx(`${_Dialog}-action`, `${_Dialog}-action--cancel`)}
                    onClick={() => {
                        onCancel?.();
                        onClose?.();
                    }}
                >
                    {cancelRename ?? "Cancel"}
                </button>
            ) : null}

            <button
                className={clsx(`${_Dialog}-action`, `${_Dialog}-action--done`, { disabled: noSubmit })}
                disabled={noSubmit}
                onClick={() => {
                    onSubmit?.();
                    onClose?.();
                }}
            >
                {doneRename ?? "Done"}
            </button>
        </MUIDialogActions>
    </MUIDialog>
);
