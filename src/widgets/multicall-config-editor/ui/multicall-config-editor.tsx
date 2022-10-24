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

    const [changesDiff, changesDiffUpdate] = useReducer(
        (
            previousState: typeof changesDiffInitialState,
            update: Partial<MulticallConfigChanges>
        ): MulticallConfigChanges => Object.assign(previousState, update),

        changesDiffInitialState
    );

    const formReset = useCallback(
        () => changesDiffUpdate(changesDiffInitialState),
        [changesDiffUpdate, changesDiffInitialState]
    );

    const onCancel = useCallback(() => {
        formReset();
        editModeSwitch(false);
    }, [editModeSwitch, formReset]);

    const onEdit = useCallback(
        (update: Partial<MulticallConfigChanges>) => {
            changesDiffUpdate(update);

            editModeSwitch(
                JSON.stringify(Object.assign(changesDiff, update)) !== JSON.stringify(changesDiffInitialState)
            );
        },

        [changesDiffUpdate]
    );

    const onSubmit = useCallback(() => editModeSwitch(false), [editModeSwitch]);

    console.log(changesDiff);

    return (
        <div className={clsx(_MulticallConfigEditor, className)}>
            <MulticallInstance.AdminsTable
                className={`${_MulticallConfigEditor}-admins`}
                controllerContractAddress={controllerContractAddress}
            />

            <TokensWhitelistEdit.Form
                className={`${_MulticallConfigEditor}-tokensWhitelist`}
                disabled={!editMode}
                {...{ controllerContractAddress, onEdit }}
            />

            <JobsSettingsEdit.Form
                className={`${_MulticallConfigEditor}-jobsSettings`}
                {...{ controllerContractAddress, multicallContract, onEdit }}
            />

            <Tile
                classes={{
                    content: clsx(`${_MulticallConfigEditor}-proposalForm`, { "is-inEditMode": editMode }),
                }}
                heading={editMode ? "Changes proposal" : null}
            >
                {!editMode && <p>To create config changes proposal template, start editing</p>}

                {editMode && (
                    <>
                        <div>
                            <h3>Description</h3>
                            <TextInput />
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
                    </>
                )}
            </Tile>
        </div>
    );
};
