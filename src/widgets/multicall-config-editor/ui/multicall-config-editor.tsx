import clsx from "clsx";
import { useCallback, useMemo, useState, FormEventHandler } from "react";

import { MulticallInstance } from "../../../entities";
import { JobSettingsEdit, TokensWhitelistEdit } from "../../../features";
import { ArgsString } from "../../../shared/lib/args";
import { MulticallContract } from "../../../shared/lib/contracts/multicall";
import { signAndSendTxs } from "../../../shared/lib/wallet";
import { MulticallConfigEditorConfig, MulticallConfigEditorWidget } from "../config";

import { MulticallConfigEditorProposalSummary } from "./mce-proposal-summary";
import "./multicall-config-editor.scss";

export const MulticallConfigEditor = ({ className, contracts }: MulticallConfigEditorWidget.Dependencies) => {
    const [editMode, editModeSwitch] = useState(false);

    const changesDiffInitialState: MulticallConfigEditorWidget.ChangesDiff = {
        [TokensWhitelistEdit.DiffKey.removeTokens]: [],
        [TokensWhitelistEdit.DiffKey.addTokens]: [],
        [JobSettingsEdit.DiffKey.jobBond]: "",
        [JobSettingsEdit.DiffKey.croncatManager]: "",
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
        (update: Partial<MulticallConfigEditorWidget.ChangesDiff>) => {
            void changesDiffUpdate((latestState) => Object.assign(latestState, update));

            void editModeSwitch(
                Object.values(Object.assign(changesDiff, update)).filter(({ length }) => length > 0).length > 0
            );

            // TODO: Remove before release. This is for debug purposes only
            console.table({ proposalDescription, ...changesDiff });
        },

        [editModeSwitch, changesDiff, changesDiffUpdate, proposalDescription]
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

    return (
        <div className={clsx(MulticallConfigEditorConfig.classes.root, className)}>
            <MulticallInstance.AdminsTable
                className={`${MulticallConfigEditorConfig.classes.root}-admins`}
                daoContractAddress={contracts.dao.address}
            />

            <TokensWhitelistEdit.Form
                className={`${MulticallConfigEditorConfig.classes.root}-tokensWhitelist`}
                daoContractAddress={contracts.dao.address}
                disabled={!editMode}
                resetTrigger={childFormsResetRequested}
                {...{ onEdit }}
            />

            <JobSettingsEdit.Form
                className={`${MulticallConfigEditorConfig.classes.root}-jobsSettings`}
                daoContractAddress={contracts.dao.address}
                disabled={!editMode}
                multicallContract={contracts.multicall}
                resetTrigger={childFormsResetRequested}
                {...{ onEdit }}
            />

            <MulticallConfigEditorProposalSummary
                description={proposalDescription}
                onDescriptionUpdate={proposalDescriptionUpdate}
                {...{ changesDiff, editMode, formValues, onCancel, onSubmit }}
            />
        </div>
    );
};
