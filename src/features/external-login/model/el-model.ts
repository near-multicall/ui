/**
 * !TODO: Use 3rd party solution for dialogs management
 */

import { useCallback, useEffect, useState } from "react";

import { ModuleContext } from "../module-context";

const _dialogOpenRequested = "dialogOpenRequested";

type DialogOpenRequestedEvent = CustomEventInit<{
    dialogKey: "dao" | "multicall";
}>;

const dialogOpenRequested = {
    dispatch: (dialogKey: keyof typeof ModuleContext.methods) =>
        document.dispatchEvent(new CustomEvent(_dialogOpenRequested, { detail: { dialogKey } })),

    subscribe: (callback: EventListener) => {
        document.addEventListener(_dialogOpenRequested, callback);

        return () => document.removeEventListener(_dialogOpenRequested, callback);
    },
};

export class ELModel {
    static dialogOpenRequested = dialogOpenRequested.dispatch;

    static useDialogsState = () => {
        const [dialogsVisibility, dialogVisibilitySwitch] = useState<
            Record<keyof typeof ModuleContext.methods, boolean> | {}
        >(
            Object.values(ModuleContext.methods).reduce(
                (visibilityState, { type }) => ({ ...visibilityState, [type]: false }),
                {}
            )
        );

        useEffect(
            () =>
                dialogOpenRequested.subscribe(({ detail }: DialogOpenRequestedEvent) =>
                    dialogVisibilitySwitch(
                        Object.keys(dialogsVisibility).reduce(
                            (visibilityState, someDialogKey) => ({
                                ...visibilityState,
                                [someDialogKey]: someDialogKey === detail?.dialogKey ? true : false,
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
