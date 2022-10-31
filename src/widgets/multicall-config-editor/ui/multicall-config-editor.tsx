import clsx from "clsx";
import { useCallback, useMemo, useState } from "react";

import { MulticallInstance } from "../../../entities";
import { JobSettingsEdit, TokensWhitelistEdit } from "../../../features";
import { ArgsString } from "../../../shared/lib/args";
import { MulticallContract, type MulticallConfigChanges } from "../../../shared/lib/contracts/multicall";
import { signAndSendTxs } from "../../../shared/lib/wallet";
import { Button, ButtonGroup, TextInput, Tile } from "../../../shared/ui/components";
import { type MulticallConfigEditorWidget } from "../config";

import "./multicall-config-editor.scss";

interface MulticallConfigEditorUIProps extends MulticallConfigEditorWidget.Dependencies {}

const _MulticallConfigEditor = "MulticallConfigEditor";

export const MulticallConfigEditorUI = ({ className, contracts }: MulticallConfigEditorUIProps) => {
    const [editMode, editModeSwitch] = useState(false);

    const changesDiffInitialState: MulticallConfigChanges = {
        removeTokens: [],
        addTokens: [],
        jobBond: "",
        croncatManager: "",
    };

    const [formState, formStateUpdate] = useState<MulticallConfigChanges>(changesDiffInitialState),
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
        void formStateUpdate(changesDiffInitialState);

        formValues.proposalDescription.value = "";
    }, [formStateUpdate, changesDiffInitialState]);

    const onCancel = useCallback(() => {
        void formReset();
        void editModeSwitch(false);
    }, [editMode, editModeSwitch, formReset]);

    const onEdit = useCallback(
        (update: Partial<MulticallConfigChanges>) => {
            void formStateUpdate((latestState) => Object.assign(latestState, update));

            void editModeSwitch(
                Object.values(Object.assign(formState, update)).filter(({ length }) => length > 0).length > 0
            );

            // TODO: Remove before release. This is for debug purposes only
            console.table({ proposalDescription, ...formState });
        },

        [editModeSwitch, formState, formStateUpdate, proposalDescription]
    );

    const onSubmit = useCallback(
        (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            void event.preventDefault();

            void contracts.dao
                .proposeFunctionCall(
                    proposalDescription,
                    contracts.multicall.address,
                    MulticallContract.configDiffToProposalActions(formState)
                )
                .then((someTx) => signAndSendTxs([someTx]))
                .catch(console.error);
        },

        [contracts, proposalDescription]
    );

    return (
        <div className={clsx(_MulticallConfigEditor, className)}>
            <MulticallInstance.AdminsTable
                className={_MulticallConfigEditor + "-admins"}
                daoContractAddress={contracts.dao.address}
            />

            <TokensWhitelistEdit.Form
                className={_MulticallConfigEditor + "-tokensWhitelist"}
                daoContractAddress={contracts.dao.address}
                disabled={!editMode}
                resetTrigger={childFormsResetRequested.subscribe}
                {...{ onEdit }}
            />

            <JobSettingsEdit.Form
                className={_MulticallConfigEditor + "-jobsSettings"}
                daoContractAddress={contracts.dao.address}
                disabled={!editMode}
                multicallContract={contracts.multicall}
                resetTrigger={childFormsResetRequested.subscribe}
                {...{ onEdit }}
            />

            <Tile
                classes={{
                    content: clsx(_MulticallConfigEditor + "-proposalForm", { "is-inEditMode": editMode }),
                }}
                heading={editMode ? "Changes proposal" : null}
            >
                <p>Start editing to create config changes proposal template</p>

                <form>
                    <div>
                        <TextInput
                            fullWidth
                            label="Description"
                            minRows={3}
                            multiline
                            required
                            update={(event) => void proposalDescriptionUpdate(event.target.value)}
                            value={formValues.proposalDescription}
                        />
                    </div>

                    <ButtonGroup>
                        <Button
                            color="error"
                            label="Cancel"
                            onClick={onCancel}
                            type="reset"
                        />

                        <Button
                            color="success"
                            disabled={
                                !(Object.values(formState).filter(({ length }) => length > 0).length > 0) ||
                                proposalDescription.length === 0
                            }
                            label="Submit"
                            onClick={onSubmit}
                            type="submit"
                        />
                    </ButtonGroup>
                </form>
            </Tile>
        </div>
    );
};
