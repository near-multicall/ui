/**
 * !TODO: Use 3rd party solution for dialogs management
 */

import { useCallback, useEffect, useState } from "react";

import { ModuleContext } from "../context";

const _dialogOpenRequested = "dialogOpenRequested";

const dialogOpenRequested = {
    dispatch: (dialogKey: keyof typeof ModuleContext.METHODS) =>
        document.dispatchEvent(new CustomEvent(_dialogOpenRequested, { detail: { dialogKey } })),

    subscribe: (callback: EventListener) => {
        document.addEventListener(_dialogOpenRequested, callback);

        return () => document.removeEventListener(_dialogOpenRequested, callback);
    },
};

export class ELDialogsModel {
    static dialogOpenRequested = dialogOpenRequested.dispatch;

    static useVisibilityState = () => {
        const [dialogsVisibility, dialogVisibilitySwitch] = useState<
            Record<keyof typeof ModuleContext.METHODS, boolean>
        >({
            dao: false,
            multicall: false,
        });

        useEffect(
            () =>
                dialogOpenRequested.subscribe((event) =>
                    dialogVisibilitySwitch(
                        Object.keys(dialogsVisibility).reduce(
                            (visibilityState, someDialogKey) => ({
                                ...visibilityState,
                                [someDialogKey]: someDialogKey === (<CustomEvent>event).detail.dialogKey ? true : false,
                            }),

                            dialogsVisibility
                        )
                    )
                ),
            []
        );

        return {
            dialogsVisibility,

            closeHandlerBinding: useCallback(
                (dialogKey: string) => () => dialogVisibilitySwitch({ ...dialogsVisibility, [dialogKey]: false }),
                [dialogVisibilitySwitch]
            ),
        };
    };
}
