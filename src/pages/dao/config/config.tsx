import { AddOutlined, DeleteOutlined, EditOutlined, PreviewOutlined, VisibilityOutlined } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import clsx from "clsx";
import { HTMLProps, useReducer, useState } from "react";

import { Multicall } from "../../../entities";
import { ArgsAccount, ArgsString } from "../../../shared/lib/args";
import { type MulticallConfigChanges, type MulticallContract } from "../../../shared/lib/contracts/multicall";
import { SputnikDAOContract } from "../../../shared/lib/contracts/sputnik-dao";
import { toNEAR } from "../../../shared/lib/converter";
import { Button, ButtonGroup, NearLink, TextInput, Tile } from "../../../shared/ui/components";

import "./config.scss";

interface DaoConfigTabComponentProps extends HTMLProps<HTMLDivElement> {
    daoContractAddress: SputnikDAOContract["address"];
    multicallContract: MulticallContract;
}

const _DaoConfigTab = "DaoConfigTab";

const DaoConfigTabComponent = ({ className, daoContractAddress, multicallContract }: DaoConfigTabComponentProps) => {
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
        <div className={clsx(_DaoConfigTab, className)}>
            <Multicall.AdminsTable
                className={`${_DaoConfigTab}-admins`}
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
                className={`${_DaoConfigTab}-tokensWhitelist`}
                daoContractAddress={daoContractAddress}
                toolbarContent={
                    tokensWhitelistEditMode ? (
                        <IconButton
                            edge="end"
                            onClick={() => tokensWhitelistEditModeSwitch(false)}
                        >
                            <VisibilityOutlined />
                        </IconButton>
                    ) : (
                        <IconButton
                            edge="end"
                            onClick={() => tokensWhitelistEditModeSwitch(true)}
                        >
                            <AddOutlined />
                        </IconButton>
                    )
                }
            />

            <Tile
                className={`${_DaoConfigTab}-jobsSettings`}
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
                    {!editMode && (multicallContract.jobBond !== "" ? toNEAR(multicallContract.jobBond) : "...") + " Ⓝ"}

                    {editMode && (
                        <TextInput
                            InputProps={{ endAdornment: "Ⓝ" }}
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
                className={clsx(`${_DaoConfigTab}-proposalForm`, { "is-inEditMode": editMode })}
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

export const DaoConfigTab = {
    connect: (props: DaoConfigTabComponentProps) => ({
        content: <DaoConfigTabComponent {...props} />,
        name: "Config",
    }),
};
