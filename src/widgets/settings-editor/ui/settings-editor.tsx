import clsx from "clsx";
import { useCallback, useMemo, useState, FormEventHandler, useEffect, useContext } from "react";

import { MI, Wallet } from "../../../entities";
import { SchedulingSettingsChange, TokenWhitelistChange } from "../../../features";
import { ArgsString } from "../../../shared/lib/args-old";
import { Multicall } from "../../../shared/lib/contracts/multicall";
import { signAndSendTxs } from "../../../shared/lib/wallet";
import { ModuleContext, SettingsEditor } from "../module-context";

import { SettingsProposalCreate } from "./settings-proposal-create";
import "./settings-editor.scss";

const _SettingsEditor = "SettingsEditor";

export const SettingsEditorUI = ({ className, adapters }: SettingsEditor.Inputs) => {
    const wallet = useContext(Wallet.SelectorContext);

    const proposalCreationPermitted =
        !wallet?.accountId || adapters.dao.checkUserPermission(wallet?.accountId, "AddProposal", "FunctionCall");

    const [editMode, editModeSwitch] = useState(false);

    const changesDiffInitialState: SettingsEditor.Diff = {
        [ModuleContext.DiffKey.removeTokens]: [],
        [ModuleContext.DiffKey.addTokens]: [],
        [ModuleContext.DiffKey.jobBond]: "",
        [ModuleContext.DiffKey.croncatManager]: "",
    };

    const [changesDiff, changesDiffUpdate] = useState<SettingsEditor.Diff>(changesDiffInitialState),
        formValues = { proposalDescription: useMemo(() => new ArgsString(""), []) },
        [proposalDescription, proposalDescriptionUpdate] = useState(formValues.proposalDescription.value),
        _childFormsResetRequested = "childFormsResetRequested";

    const childFormsResetRequested = {
        dispatch: () => document.dispatchEvent(new CustomEvent(_childFormsResetRequested)),

        subscribe: (callback: EventListener) => {
            void document.addEventListener(_childFormsResetRequested, callback);

            return () => void document.removeEventListener(_childFormsResetRequested, callback);
        },
    };

    const formReset = useCallback(() => {
        void childFormsResetRequested.dispatch();
        void proposalDescriptionUpdate("");
        void changesDiffUpdate(changesDiffInitialState);

        formValues.proposalDescription.value = "";
    }, [changesDiffUpdate, changesDiffInitialState]);

    const onCancel = useCallback(() => {
        void formReset();
        void editModeSwitch(false);
    }, [editMode, editModeSwitch, formReset]);

    const onEdit = useCallback(
        (update: Partial<SettingsEditor.Diff>) =>
            void changesDiffUpdate((latestState) => ({ ...latestState, ...update })),

        [changesDiffUpdate]
    );

    const onSubmit = useCallback<FormEventHandler>(
        (event) => {
            void event.preventDefault();

            void adapters.dao
                .proposeFunctionCall(
                    proposalDescription,
                    adapters.multicallInstance.address,
                    Multicall.configDiffToProposalActions(changesDiff)
                )
                .then((someTx) => signAndSendTxs([someTx]))
                .catch(console.error);
        },

        [changesDiff, adapters, proposalDescription]
    );

    useEffect(
        () => void editModeSwitch(Object.values(changesDiff).filter(({ length }) => length > 0).length > 0),
        [changesDiff, editModeSwitch]
    );

    return (
        <MI.SettingsProvider daoAddress={adapters.dao.address}>
            <div className={clsx(_SettingsEditor, className)}>
                {false && <MI.AdminsTable className={`${_SettingsEditor}-admins`} />}

                <TokenWhitelistChange.Form
                    className={`${_SettingsEditor}-tokenWhitelist`}
                    disabled={!proposalCreationPermitted}
                    resetTrigger={childFormsResetRequested}
                    {...{ onEdit }}
                />

                <SchedulingSettingsChange.Form
                    disabled={!proposalCreationPermitted}
                    resetTrigger={childFormsResetRequested}
                    {...{ adapters, onEdit }}
                />

                <SettingsProposalCreate
                    description={proposalDescription}
                    disabled={!proposalCreationPermitted}
                    onDescriptionUpdate={proposalDescriptionUpdate}
                    {...{ changesDiff, editMode, formValues, onCancel, onSubmit }}
                />
            </div>
        </MI.SettingsProvider>
    );
};
