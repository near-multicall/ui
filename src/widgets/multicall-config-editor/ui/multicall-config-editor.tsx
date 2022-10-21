import { AddOutlined, DeleteOutlined, EditOutlined, VisibilityOutlined } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import clsx from "clsx";
import { useReducer, useState } from "react";

import { Multicall } from "../../../entities";
import { ArgsString } from "../../../shared/lib/args";
import { type MulticallConfigChanges } from "../../../shared/lib/contracts/multicall";
import { toNEAR } from "../../../shared/lib/converter";
import { Button, ButtonGroup, NearIcons, NearLink, TextInput, Tile } from "../../../shared/ui/components";
import { type MulticallConfigEditorWidget } from "../config";

import "./multicall-config-editor.scss";

interface MulticallConfigEditorUIProps extends MulticallConfigEditorWidget.Dependencies {}

const _MulticallConfigEditor = "MulticallConfigEditor";

export const MulticallConfigEditorUI = ({
    className,
    daoContractAddress,
    multicallContract,
}: MulticallConfigEditorUIProps) => {
    const [editMode, editModeSwitch] = useState(false),
        [tokensWhitelistAddMode, tokensWhitelistAddModeSwitch] = useState(false),
        [jobsSettingsEditMode, jobsSettingsEditModeSwitch] = useState(false);

    const changesDiffInitialState = {
        removeTokens: [],
        addTokens: [],
        jobBond: "",
        croncatManager: "",
    };

    const [changesDiff, changesDiffUpdate] = useReducer(
        (
            previousState: MulticallConfigChanges,

            update: {
                reset?: boolean;
                field?: keyof MulticallConfigChanges;
                value?: string;
            }
        ): MulticallConfigChanges => {
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
        <div className={clsx(_MulticallConfigEditor, className)}>
            <Multicall.AdminsTable
                className={`${_MulticallConfigEditor}-admins`}
                daoContractAddress={daoContractAddress}
            />

            <Multicall.TokensWhitelistTable
                additionalItems={changesDiff.addTokens}
                className={`${_MulticallConfigEditor}-tokensWhitelist`}
                daoContractAddress={daoContractAddress}
                footer={
                    tokensWhitelistAddMode ? (
                        <TextInput
                            onBlur={(event) => {
                                changesDiffUpdate({ field: "addTokens", value: event.target.value });
                                tokensWhitelistAddModeSwitch(false);
                            }}
                        />
                    ) : null
                }
                headingCorners={{
                    right: (
                        <IconButton
                            onClick={() => {
                                editModeSwitch(true);
                                tokensWhitelistAddModeSwitch(true);
                            }}
                        >
                            <AddOutlined />
                        </IconButton>
                    ),
                }}
            />

            <Tile
                classes={{ root: `${_MulticallConfigEditor}-jobsSettings` }}
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
                classes={{ content: clsx(`${_MulticallConfigEditor}-proposalForm`, { "is-inEditMode": editMode }) }}
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
