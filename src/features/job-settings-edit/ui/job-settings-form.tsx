import { CancelOutlined, EditOutlined, VisibilityOutlined } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import clsx from "clsx";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";

import { ArgsString } from "../../../shared/lib/args";
import { toNEAR, toYocto } from "../../../shared/lib/converter";
import { Fn } from "../../../shared/lib/fn";
import { IconLabel, NearIcons, NearLink, Table, TextInput, Tile } from "../../../shared/ui/components";
import { type JobSettingsEditFeature } from "../config";

interface JobSettingsFormProps extends JobSettingsEditFeature.Dependencies {}

const _JobSettings = "JobSettings";

export const JobSettingsForm = ({ className, disabled, multicallContract, onEdit }: JobSettingsFormProps) => {
    const [editModeEnabled, editModeSwitch] = useState(!disabled);

    const formInitialState = { croncatManager: "", jobBond: "" };

    const [[croncatManager, croncatManagerUpdate], [jobBond, jobBondUpdate]] = [
        useState<JobSettingsEditFeature.FormState["croncatManager"]>(formInitialState.croncatManager),
        useState<JobSettingsEditFeature.FormState["jobBond"]>(formInitialState.jobBond),
    ];

    const formFields = {
        croncatManager: useMemo(() => new ArgsString(multicallContract.croncatManager), [disabled]),

        jobBond: useMemo(
            () => new ArgsString(multicallContract.jobBond !== "" ? toNEAR(multicallContract.jobBond) : ""),
            [disabled]
        ),
    };

    const formReset = useCallback(() => {
        croncatManagerUpdate(formInitialState.croncatManager);
        jobBondUpdate(formInitialState.jobBond);
        editModeSwitch(false);
    }, [croncatManagerUpdate, editModeSwitch, formInitialState, jobBondUpdate]);

    useEffect(disabled && croncatManager.length > 0 && jobBond.length > 0 ? formReset : Fn.returnVoid, [
        croncatManager,
        disabled,
        formReset,
        jobBond,
    ]);

    useEffect(() => onEdit({ croncatManager, jobBond }), [croncatManager, jobBond, onEdit]);

    return (
        <Tile
            classes={{ root: className }}
            heading="Jobs settings"
            headingCorners={{
                right: editModeEnabled ? (
                    <>
                        {(croncatManager.length > 0 || jobBond.length > 0) && (
                            <IconButton onClick={() => editModeSwitch(false)}>
                                <VisibilityOutlined />
                            </IconButton>
                        )}

                        <IconButton onClick={formReset}>
                            <CancelOutlined />
                        </IconButton>
                    </>
                ) : (
                    <IconButton onClick={() => editModeSwitch(true)}>
                        <EditOutlined />
                    </IconButton>
                ),
            }}
        >
            <Table
                displayMode="compact"
                dense
                entitled
                header={["Property", "Value"]}
                rows={[
                    [
                        "Croncat manager",

                        editModeEnabled ? (
                            <TextInput
                                update={(event) => croncatManagerUpdate(event.target.value)}
                                value={formFields.croncatManager}
                                fullWidth
                            />
                        ) : (
                            <NearLink address={croncatManager || multicallContract.croncatManager} />
                        ),
                    ],
                    [
                        "Job bond",

                        editModeEnabled ? (
                            <TextInput
                                InputProps={{
                                    endAdornment: NearIcons.NATIVE_TOKEN_CHARACTER,
                                    inputProps: { min: 0, step: 0.001 },
                                }}
                                update={(event) => jobBondUpdate(toYocto(event.target.value))}
                                type="number"
                                value={formFields.jobBond}
                            />
                        ) : (
                            <IconLabel
                                icon={NearIcons.NATIVE_TOKEN_CHARACTER}
                                label={
                                    jobBond || multicallContract.jobBond !== ""
                                        ? toNEAR(jobBond || multicallContract.jobBond)
                                        : "..."
                                }
                            />
                        ),
                    ],
                ]}
            />
        </Tile>
    );
};
