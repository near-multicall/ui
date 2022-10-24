import clsx from "clsx";
import { useCallback, useReducer, useState } from "react";

import { MulticallInstance } from "../../../entities";
import { JobsSettingsEdit, TokensWhitelistEdit } from "../../../features";
import { type MulticallConfigChanges } from "../../../shared/lib/contracts/multicall";
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

    const [formState, formStateUpdate] = useReducer(
        (
            latestState: typeof changesDiffInitialState,
            update: Partial<MulticallConfigChanges>
        ): MulticallConfigChanges => Object.assign(latestState, update),

        changesDiffInitialState
    );

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
            const newFormState = Object.assign(formState, update);

            formStateUpdate(newFormState);
            editModeSwitch(Object.values(newFormState).filter(({ length }) => length > 0).length > 0);
            console.log(formState);
        },

        [formState, formStateUpdate]
    );

    const onSubmit = useCallback(() => editModeSwitch(false), [editModeSwitch]);

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

            <JobsSettingsEdit.Form
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
                <p>To create config changes proposal template, start editing</p>

                <form>
                    <div>
                        <TextInput
                            fullWidth
                            label="Description"
                            minRows={3}
                            multiline
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
                            label="Submit"
                            onClick={onSubmit}
                        />
                    </ButtonGroup>
                </form>
            </Tile>
        </div>
    );
};
