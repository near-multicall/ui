/**
 * !TODO: Use 3rd party solution for dialogs management.
 * !UI-specific logic should not be described within services!
 */

import { useCallback, useEffect, useState } from "react";

import { ExtAuthParams } from "./ext-auth.params";

const _dialogOpenRequested = "dialogOpenRequested";

type DialogOpenRequestedEvent = CustomEventInit<{
    dialogKey: "dao" | "multicall";
}>;

const dialogOpenRequested = {
    dispatch: (dialogKey: keyof typeof ExtAuthParams.methods) =>
        document.dispatchEvent(new CustomEvent(_dialogOpenRequested, { detail: { dialogKey } })),

    subscribe: (callback: EventListener) => {
        document.addEventListener(_dialogOpenRequested, callback);

        return () => document.removeEventListener(_dialogOpenRequested, callback);
    },
};

export class ExtAuthService {
    static dialogOpenRequested = dialogOpenRequested.dispatch;

    static useDialogsState = () => {
        const [dialogsVisibility, dialogVisibilitySwitch] = useState<
            Record<keyof typeof ExtAuthParams.methods, boolean>
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
