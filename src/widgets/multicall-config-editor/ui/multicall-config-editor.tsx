import clsx from "clsx";
import { useCallback, useMemo, useState } from "react";

import { MulticallInstance } from "../../../entities";
import { JobSettingsEdit, TokensWhitelistEdit } from "../../../features";
import { ArgsString } from "../../../shared/lib/args";
import { MulticallContract, type MulticallConfigChanges } from "../../../shared/lib/contracts/multicall";
import { SputnikDAOContract } from "../../../shared/lib/contracts/sputnik-dao";
import { signAndSendTxs } from "../../../shared/lib/wallet";
import { Button, ButtonGroup, TextInput, Tile } from "../../../shared/ui/components";
import { type MulticallConfigEditorWidget } from "../config";

import "./multicall-config-editor.scss";

interface MulticallConfigEditorUIProps extends MulticallConfigEditorWidget.Dependencies {}

const _MulticallConfigEditor = "MulticallConfigEditor";

export const MulticallConfigEditorUI = ({
    className,
    controllerContractAddress,
    multicallContract,
}: MulticallConfigEditorUIProps) => {
    const [editMode, editModeSwitch] = useState(false);

    const changesDiffInitialState: MulticallConfigChanges = {
        removeTokens: [],
        addTokens: [],
        jobBond: "",
        croncatManager: "",
    };

    const [formState, formStateUpdate] = useState<MulticallConfigChanges>(changesDiffInitialState),
        [proposalDescription, proposalDescriptionUpdate] = useState("");

    const formReset = useCallback(
        () => formStateUpdate(changesDiffInitialState),
        [formStateUpdate, changesDiffInitialState]
    );

    const onCancel = useCallback(() => {
        formReset();
        editModeSwitch(false);
    }, [editModeSwitch, formReset]);

    const onEdit = useCallback(
        (update: Partial<MulticallConfigChanges>) => {
            formStateUpdate((latestState) => Object.assign(latestState, update));

            editModeSwitch(
                Object.values(Object.assign(formState, update)).filter(({ length }) => length > 0).length > 0
            );

            console.log(proposalDescription);
            console.table(formState);
        },

        [editModeSwitch, formState, formStateUpdate, proposalDescription]
    );

    const onSubmit = useCallback(() => {
        SputnikDAOContract.init(controllerContractAddress)
            .then((instanceController) =>
                instanceController
                    .proposeFunctionCall(
                        proposalDescription,
                        multicallContract.address,
                        MulticallContract.configDiffToProposalActions(formState)
                    )
                    .then((someTx) => signAndSendTxs([someTx]))
            )
            .catch(console.error);

        editModeSwitch(false);
    }, [controllerContractAddress, editModeSwitch]);

    return (
        <div className={clsx(_MulticallConfigEditor, className)}>
            <MulticallInstance.AdminsTable
                className={`${_MulticallConfigEditor}-admins`}
                {...{ controllerContractAddress }}
            />

            <TokensWhitelistEdit.Form
                className={`${_MulticallConfigEditor}-tokensWhitelist`}
                disabled={!editMode}
                {...{ controllerContractAddress, onEdit }}
            />

            <JobSettingsEdit.Form
                className={`${_MulticallConfigEditor}-jobsSettings`}
                disabled={!editMode}
                {...{ controllerContractAddress, multicallContract, onEdit }}
            />

            <Tile
                classes={{
                    content: clsx(`${_MulticallConfigEditor}-proposalForm`, { "is-inEditMode": editMode }),
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
                            value={useMemo(() => new ArgsString(""), [])}
                        />
                    </div>

                    <ButtonGroup>
                        <Button
                            color="error"
                            label="Cancel"
                            onClick={onCancel}
                        />

                        <Button
                            color="success"
                            disabled={
                                !(Object.values(formState).filter(({ length }) => length > 0).length > 0) ||
                                proposalDescription.length === 0
                            }
                            label="Submit"
                            onClick={onSubmit}
                        />
                    </ButtonGroup>
                </form>
            </Tile>
        </div>
    );
};
