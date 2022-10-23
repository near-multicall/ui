import { EditOutlined } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import clsx from "clsx";
import { useCallback, useEffect, useReducer, useState } from "react";

import { MI } from "../../../entities";
import { MITokensWhitelistEdit } from "../../../features";
import { ArgsString } from "../../../shared/lib/args";
import { type MulticallConfigChanges } from "../../../shared/lib/contracts/multicall";
import { toNEAR } from "../../../shared/lib/converter";
import { Button, ButtonGroup, NearIcons, NearLink, TextInput, Tile } from "../../../shared/ui/components";
import { type MIEntityConfigEditorWidget } from "../config";

import "./multicall-config-editor.scss";

interface MIEntityConfigEditorUIProps extends MIEntityConfigEditorWidget.Dependencies {}

const _MIEntityConfigEditor = "MIEntityConfigEditor";

export const MIEntityConfigEditorUI = ({
    className,
    controllerContractAddress,
    multicallContract,
}: MIEntityConfigEditorUIProps) => {
    const [editMode, editModeSwitch] = useState(false),
        [jobsSettingsEditMode, jobsSettingsEditModeSwitch] = useState(false);

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
        <div className={clsx(_MIEntityConfigEditor, className)}>
            <MI.AdminsTable
                className={`${_MIEntityConfigEditor}-admins`}
                controllerContractAddress={controllerContractAddress}
            />

            <MITokensWhitelistEdit.Form
                className={`${_MIEntityConfigEditor}-tokensWhitelist`}
                disabled={!editMode}
                {...{ controllerContractAddress, onEdit }}
            />

            <Tile
                classes={{ root: `${_MIEntityConfigEditor}-jobsSettings` }}
                heading="Jobs settings"
            >
                <h3>Croncat manager</h3>

                <IconButton
                    edge="start"
                    onClick={() => {
                        editModeSwitch(true);
                        jobsSettingsEditModeSwitch(true);
                    }}
                >
                    <EditOutlined />
                </IconButton>

                {editMode && jobsSettingsEditMode ? (
                    <TextInput
                        onBlur={(event) => changesDiffUpdate({ croncatManager: event.target.value })}
                        value={new ArgsString(multicallContract.croncatManager)}
                        fullWidth
                    />
                ) : (
                    <NearLink address={multicallContract.croncatManager} />
                )}

                <h3>Job bond</h3>

                <span>
                    {!editMode &&
                        `${multicallContract.jobBond !== "" ? toNEAR(multicallContract.jobBond) : "..."} ${
                            NearIcons.NATIVE_TOKEN_CHARACTER
                        }`}

                    {editMode && (
                        <TextInput
                            InputProps={{ endAdornment: NearIcons.NATIVE_TOKEN_CHARACTER }}
                            update={(event) => changesDiffUpdate({ jobBond: event.target.value })}
                            type="number"
                            value={
                                new ArgsString(
                                    multicallContract.jobBond !== "" ? toNEAR(multicallContract.jobBond) : ""
                                )
                            }
                        />
                    )}
                </span>
            </Tile>

            <Tile
                classes={{ content: clsx(`${_MIEntityConfigEditor}-proposalForm`, { "is-inEditMode": editMode }) }}
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
