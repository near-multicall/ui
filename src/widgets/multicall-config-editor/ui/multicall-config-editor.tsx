import clsx from "clsx";
import { useCallback, useMemo, useState, FormEventHandler, useEffect } from "react";

import { MulticallInstance } from "../../../entities";
import { JobSettingsEdit, TokensWhitelistEdit } from "../../../features";
import { ArgsString } from "../../../shared/lib/args";
import { MulticallContract } from "../../../shared/lib/contracts/multicall";
import { signAndSendTxs } from "../../../shared/lib/wallet";
import { MulticallConfigEditorConfig, MulticallConfigEditorWidget } from "../config";

import { MCEChangesProposal } from "./mce-changes-proposal";
import "./multicall-config-editor.scss";

const _MulticallConfigEditor = "MulticallConfigEditor";

export const MulticallConfigEditorUI = ({ className, contracts }: MulticallConfigEditorWidget.Inputs) => {
    const [editMode, editModeSwitch] = useState(false);

    const changesDiffInitialState: MulticallConfigEditorWidget.ChangesDiff = {
        [MulticallConfigEditorConfig.ChangesDiffKey.removeTokens]: [],
        [MulticallConfigEditorConfig.ChangesDiffKey.addTokens]: [],
        [MulticallConfigEditorConfig.ChangesDiffKey.jobBond]: "",
        [MulticallConfigEditorConfig.ChangesDiffKey.croncatManager]: "",
    };

    const [changesDiff, changesDiffUpdate] = useState<MulticallConfigEditorWidget.ChangesDiff>(changesDiffInitialState),
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
        (update: Partial<MulticallConfigEditorWidget.ChangesDiff>) =>
            void changesDiffUpdate((latestState) => ({ ...latestState, ...update })),

        [changesDiffUpdate]
    );

    const onSubmit = useCallback<FormEventHandler>(
        (event) => {
            void event.preventDefault();

            void contracts.dao
                .proposeFunctionCall(
                    proposalDescription,
                    contracts.multicall.address,
                    MulticallContract.configDiffToProposalActions(changesDiff)
                )
                .then((someTx) => signAndSendTxs([someTx]))
                .catch(console.error);
        },

        [contracts, proposalDescription]
    );

    useEffect(
        () => void editModeSwitch(Object.values(changesDiff).filter(({ length }) => length > 0).length > 0),
        [changesDiff, editModeSwitch]
    );

    return (
        <div className={clsx(_MulticallConfigEditor, className)}>
            <MulticallInstance.AdminsTable
                className={`${_MulticallConfigEditor}-admins`}
                daoContractAddress={contracts.dao.address}
            />

            <TokensWhitelistEdit.Form
                className={`${_MulticallConfigEditor}-tokensWhitelist`}
                daoContractAddress={contracts.dao.address}
                disabled={!editMode}
                resetTrigger={childFormsResetRequested}
                {...{ onEdit }}
            />

            <JobSettingsEdit.Form
                className={`${_MulticallConfigEditor}-jobsSettings`}
                daoContractAddress={contracts.dao.address}
                disabled={!editMode}
                multicallContract={contracts.multicall}
                resetTrigger={childFormsResetRequested}
                {...{ onEdit }}
            />

            <MCEChangesProposal
                classNameRoot={_MulticallConfigEditor}
                description={proposalDescription}
                onDescriptionUpdate={proposalDescriptionUpdate}
                {...{ changesDiff, editMode, formValues, onCancel, onSubmit }}
            />
        </div>
    );
};
