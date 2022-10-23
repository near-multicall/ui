import { AddOutlined, CancelOutlined, DeleteOutlined, EditOutlined, VisibilityOutlined } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import clsx from "clsx";
import { useReducer, useState } from "react";

import { MI } from "../../../entities";
import { MITokensWhitelistEdit } from "../../../features";
import { ArgsString } from "../../../shared/lib/args";
import { type MIEntityConfigChanges } from "../../../shared/lib/contracts/multicall";
import { toNEAR } from "../../../shared/lib/converter";
import {
    Button,
    ButtonGroup,
    NearIcons,
    NearLink,
    TableRowCompact,
    TextInput,
    Tile,
} from "../../../shared/ui/components";
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

    const changesDiffInitialState = {
        removeTokens: [],
        addTokens: [],
        jobBond: "",
        croncatManager: "",
    };

    const [changesDiff, changesDiffUpdate] = useReducer(
        (
            previousState: MIEntityConfigChanges,

            update: {
                reset?: boolean;
                field?: keyof MIEntityConfigChanges;
                value?: string;
            }
        ): MIEntityConfigChanges => {
            if (update.reset) {
                return changesDiffInitialState;
            } else {
                return Object.assign(
                    previousState,

                    update.field &&
                        update.value && {
                            [update.field]: Array.isArray(previousState[update.field])
                                ? previousState[update.field].includes(update.value)
                                    ? previousState[update.field]
                                    : previousState[update.field].concat(update.value)
                                : update.value,
                        }
                );
            }
        },

        changesDiffInitialState
    );

    console.log(changesDiff);

    return (
        <div className={clsx(_MIEntityConfigEditor, className)}>
            <MI.AdminsTable
                className={`${_MIEntityConfigEditor}-admins`}
                controllerContractAddress={controllerContractAddress}
            />

            <MITokensWhitelistEdit.Form
                className={`${_MIEntityConfigEditor}-tokensWhitelist`}
                onChange={() => {}}
                {...{ controllerContractAddress }}
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
                        onBlur={(event) => changesDiffUpdate({ field: "croncatManager", value: event.target.value })}
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
                            update={(event) => changesDiffUpdate({ field: "jobBond", value: event.target.value })}
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
                {editMode && (
                    <div>
                        <h3>Description</h3>
                        <TextInput />
                    </div>
                )}

                <ButtonGroup>
                    {!editMode ? (
                        <Button
                            color="success"
                            label="Draft changes"
                            onClick={() => editModeSwitch(true)}
                        />
                    ) : (
                        <>
                            <Button
                                color="error"
                                label="Cancel"
                                onClick={() => {
                                    changesDiffUpdate({ reset: true });
                                    editModeSwitch(false);
                                }}
                            />

                            <Button
                                color="success"
                                label="Submit"
                                onClick={() => editModeSwitch(false)}
                            />
                        </>
                    )}
                </ButtonGroup>
            </Tile>
        </div>
    );
};
