import clsx from "clsx";
import { useCallback, useState, useEffect, useContext, HTMLProps, ComponentProps } from "react";

import { SputnikDAO } from "../../shared/lib/contracts/sputnik-dao";
import { Tile } from "../../shared/ui/design";
import { MI, Wallet } from "../../entities";
import { ConfigureScheduling, ManageTokenWhitelist, ProposeSettings } from "../../features";

import "./settings-manager.ui.scss";

const _SettingsManager = "SettingsManager";

export interface SettingsManagerUIProps extends HTMLProps<HTMLDivElement> {
    dao: SputnikDAO;
}

export const SettingsManagerUI = ({ className, dao }: SettingsManagerUIProps) => {
    const wallet = useContext(Wallet.Context),
        multicallInstance = useContext(MI.Context);

    const canCreateProposals =
        !wallet?.accountId || dao.checkUserPermission(wallet?.accountId, "AddProposal", "FunctionCall");

    const initialDiff: ComponentProps<typeof ProposeSettings["UI"]>["diff"] = {
        addTokens: [],
        jobBond: "",
        removeTokens: [],
    };

    const [editMode, editModeSwitch] = useState(false),
        [diff, diffUpdate] = useState(initialDiff),
        _childFormsResetRequested = "childFormsResetRequested";

    const resetTrigger = {
        dispatch: () => document.dispatchEvent(new CustomEvent(_childFormsResetRequested)),

        subscribe: (callback: EventListener) => {
            void document.addEventListener(_childFormsResetRequested, callback);

            return () => void document.removeEventListener(_childFormsResetRequested, callback);
        },
    };

    const formReset = useCallback(() => {
        void resetTrigger.dispatch();
        void diffUpdate(initialDiff);
    }, [diffUpdate, initialDiff]);

    const onCancel = useCallback(() => {
        void formReset();
        void editModeSwitch(false);
    }, [editMode, editModeSwitch, formReset]);

    const onEdit = useCallback(
        (update: Partial<typeof initialDiff>) => void diffUpdate((latestState) => ({ ...latestState, ...update })),
        [diffUpdate]
    );

    useEffect(
        () => void editModeSwitch(Object.values(diff).filter(({ length }) => length > 0).length > 0),
        [diff, editModeSwitch]
    );

    return (
        <div className={clsx(_SettingsManager, { "is-displayingError": multicallInstance.error !== null }, className)}>
            <Tile
                classes={{ root: `${_SettingsManager}-error` }}
                error={multicallInstance.error}
            />

            {false && <MI.AdminsTable className={`${_SettingsManager}-admins`} />}

            <ManageTokenWhitelist.UI
                className={`${_SettingsManager}-tokenWhitelist`}
                disabled={!canCreateProposals}
                {...{ onEdit, resetTrigger }}
            />

            <ConfigureScheduling.UI
                disabled={!canCreateProposals}
                {...{ onEdit, resetTrigger }}
            />

            <ProposeSettings.UI
                disabled={!canCreateProposals}
                {...{ diff, dao, editMode, onCancel }}
            />
        </div>
    );
};
