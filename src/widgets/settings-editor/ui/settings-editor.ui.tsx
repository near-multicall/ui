import clsx from "clsx";
import { useCallback, useState, useEffect, useContext, HTMLProps } from "react";

import { MulticallInstance, Wallet } from "../../../entities";
import { ManageScheduleSettings, ManageTokenWhitelist, ProposeSettings } from "../../../features";
import { MulticallSettingsChange } from "../../../shared/lib/contracts/multicall";
import { SputnikDAO } from "../../../shared/lib/contracts/sputnik-dao";
import { ModuleContext } from "../module-context";
import { Tile } from "../../../shared/ui/design";

import "./settings-editor.ui.scss";

const _SettingsEditor = "SettingsEditor";

export interface SettingsEditorProps extends HTMLProps<HTMLDivElement> {
    dao: SputnikDAO;
}

export const SettingsEditor = ({ className, dao }: SettingsEditorProps) => {
    const wallet = useContext(Wallet.SelectorContext),
        multicallInstance = useContext(MulticallInstance.Context);

    const canCreateProposals =
        !wallet?.accountId || dao.checkUserPermission(wallet?.accountId, "AddProposal", "FunctionCall");

    const initialDiff: MulticallSettingsChange = {
        [ModuleContext.DiffKey.removeTokens]: [],
        [ModuleContext.DiffKey.addTokens]: [],
        [ModuleContext.DiffKey.jobBond]: "",
        [ModuleContext.DiffKey.croncatManager]: "",
    };

    const [editMode, editModeSwitch] = useState(false),
        [diff, diffUpdate] = useState<MulticallSettingsChange>(initialDiff),
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
        (update: Partial<MulticallSettingsChange>) => void diffUpdate((latestState) => ({ ...latestState, ...update })),

        [diffUpdate]
    );

    useEffect(
        () => void editModeSwitch(Object.values(diff).filter(({ length }) => length > 0).length > 0),
        [diff, editModeSwitch]
    );

    return (
        <div className={clsx(_SettingsEditor, { "is-displayingError": multicallInstance.error !== null }, className)}>
            <Tile
                classes={{ root: `${_SettingsEditor}-error` }}
                error={multicallInstance.error}
            />

            {false && <MulticallInstance.AdminsTable className={`${_SettingsEditor}-admins`} />}

            <ManageTokenWhitelist.UI
                className={`${_SettingsEditor}-tokenWhitelist`}
                disabled={!canCreateProposals}
                {...{ onEdit, resetTrigger }}
            />

            <ManageScheduleSettings.UI
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
