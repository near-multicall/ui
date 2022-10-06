import { useCallback, useEffect, useState } from "react";

import { DappLoginConfig as Config } from "../config";

/**
 * !TODO: Use 3rd party solution for dialogs management
 */

const _dialogOpenRequested = "dialogopenrequested";

const dialogOpenRequested = {
    dispatch: (dialogKey: keyof typeof Config.METHODS) =>
        document.dispatchEvent(new CustomEvent(_dialogOpenRequested, { detail: { dialogKey } })),

    subscribe: (callback: EventListener) => {
        document.addEventListener(_dialogOpenRequested, callback);

        return () => document.removeEventListener(_dialogOpenRequested, callback);
    },
};

const useDappLoginDialogsVisibilityState = () => {
    const [dialogsVisibility, dialogVisibilitySwitch] = useState<Record<keyof typeof Config.METHODS, boolean> | {}>(
        Object.values(Config.METHODS).reduce((visibilityState, { type }) => ({ ...visibilityState, [type]: false }), {})
    );

    useEffect(
        () =>
            dialogOpenRequested.subscribe(({ detail }) =>
                dialogVisibilitySwitch(
                    Object.keys(dialogsVisibility).reduce(
                        (visibilityState, someDialogKey) => ({
                            ...visibilityState,
                            [someDialogKey]: someDialogKey === detail.dialogKey ? true : false,
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

export class DappLoginDialogsModel {
    static dialogOpenRequested = dialogOpenRequested.dispatch;
    static useVisibilityState = useDappLoginDialogsVisibilityState;
}
