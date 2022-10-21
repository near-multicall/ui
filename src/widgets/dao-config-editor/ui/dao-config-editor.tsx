import { AddOutlined, DeleteOutlined, EditOutlined, VisibilityOutlined } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import clsx from "clsx";
import { useReducer, useState } from "react";

import { Multicall } from "../../../entities";
import { ArgsString } from "../../../shared/lib/args";
import { type MulticallConfigChanges } from "../../../shared/lib/contracts/multicall";
import { toNEAR } from "../../../shared/lib/converter";
import { Button, ButtonGroup, NearIcons, NearLink, TextInput, Tile } from "../../../shared/ui/components";
import { type DaoConfigEditorWidget } from "../config";

import "./dao-config-editor.scss";

interface DaoConfigEditorUIProps extends DaoConfigEditorWidget.Dependencies {}

const _DaoConfigEditor = "DaoConfigEditor";

export const DaoConfigEditorUI = ({ className, daoContractAddress, multicallContract }: DaoConfigEditorUIProps) => {
    const [editMode, editModeSwitch] = useState(false),
        [tokensWhitelistEditMode, tokensWhitelistEditModeSwitch] = useState(false),
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
                value?: MulticallConfigChanges[keyof MulticallConfigChanges];
            }
        ): MulticallConfigChanges =>
            update.reset
                ? changesDiffInitialState
                : {
                      ...previousState,

                      ...(update.field && update.value
                          ? {
                                [update.field as keyof MulticallConfigChanges]: Array.isArray(update.value)
                                    ? (previousState[update.field as keyof MulticallConfigChanges] as string[]).concat(
                                          update.value
                                      )
                                    : update.value,
                            }
                          : {}),
                  },

        changesDiffInitialState
    );

    console.log(changesDiff);

    return (
        <div className={clsx(_DaoConfigEditor, className)}>
            <Multicall.AdminsTable
                className={`${_DaoConfigEditor}-admins`}
                daoContractAddress={daoContractAddress}
            />

            <Multicall.TokensWhitelistTable
                additionalItems={changesDiff.addTokens
                    .map(Multicall.whitelistedTokenTableRow)
                    .concat(
                        tokensWhitelistEditMode
                            ? [
                                  <TextInput
                                      onBlur={(event) =>
                                          changesDiffUpdate({ field: "addTokens", value: event.target.value })
                                      }
                                  />,
                              ]
                            : []
                    )}
                className={`${_DaoConfigEditor}-tokensWhitelist`}
                daoContractAddress={daoContractAddress}
                toolbarContent={
                    tokensWhitelistEditMode ? (
                        <IconButton
                            onClick={() => {
                                editModeSwitch(true);
                                tokensWhitelistEditModeSwitch(false);
                            }}
                        >
                            <VisibilityOutlined />
                        </IconButton>
                    ) : (
                        <IconButton
                            onClick={() => {
                                editModeSwitch(true);
                                tokensWhitelistEditModeSwitch(true);
                            }}
                        >
                            <AddOutlined />
                        </IconButton>
                    )
                }
            />

            <Tile
                classes={{ root: `${_DaoConfigEditor}-jobsSettings` }}
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
                classes={{ content: clsx(`${_DaoConfigEditor}-proposalForm`, { "is-inEditMode": editMode }) }}
                heading={editMode ? "Changes proposal" : null}
            >
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
