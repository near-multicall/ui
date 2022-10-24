import { CancelOutlined, EditOutlined, VisibilityOutlined } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";

import { ArgsString } from "../../../shared/lib/args";
import { toNEAR } from "../../../shared/lib/converter";
import { Fn } from "../../../shared/lib/fn";
import { NearIcons, NearLink, TextInput, Tile } from "../../../shared/ui/components";
import { type JobSettingsEditFeature } from "../config";

interface JobSettingsFormProps extends JobSettingsEditFeature.Dependencies {}

const _JobSettings = "JobSettings";

export const JobSettingsForm = ({ className, disabled, multicallContract, onEdit }: JobSettingsFormProps) => {
    const [editModeEnabled, editModeSwitch] = useState(!disabled);

    const formInitialState: JobSettingsEditFeature.FormState = {
        croncatManager: "",
        jobBond: "",
    };

    const [formValues, formValuesUpdate] = useReducer(
        (latestState: JobSettingsEditFeature.FormState, update: Partial<JobSettingsEditFeature.FormState>) =>
            Object.assign(latestState, update),

        formInitialState
    );

    const formFields = {
        croncatManager: useMemo(() => new ArgsString(multicallContract.croncatManager), []),

        jobBond: useMemo(
            () => new ArgsString(multicallContract.jobBond !== "" ? toNEAR(multicallContract.jobBond) : ""),
            []
        ),
    };

    const formReset = useCallback(() => {
        formValuesUpdate(formInitialState);
        editModeSwitch(false);
    }, [editModeSwitch, formInitialState, formValuesUpdate]);

    useEffect(
        disabled && Object.values(formValues).filter(({ length }) => length > 0).length > 0 ? formReset : Fn.returnVoid,
        [disabled, formValues, formReset]
    );

    useEffect(() => onEdit(formValues), [formValues.croncatManager, formValues.jobBond, onEdit]);

    console.log(formValues);

    return (
        <Tile
            classes={{ root: className }}
            heading="Jobs settings"
            headingCorners={{
                right: editModeEnabled ? (
                    <>
                        {Object.values(formValues).filter(({ length }) => length > 0).length > 0 && (
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
            {editModeEnabled ? (
                <TextInput
                    label="Croncat manager"
                    update={(event) => formValuesUpdate({ croncatManager: event.target.value })}
                    value={formFields.croncatManager}
                    fullWidth
                />
            ) : (
                <span>
                    <h3>Croncat manager</h3>
                    <NearLink address={multicallContract.croncatManager} />
                </span>
            )}

            {editModeEnabled ? (
                <TextInput
                    InputProps={{ endAdornment: NearIcons.NATIVE_TOKEN_CHARACTER }}
                    label="Job bond"
                    update={(event) => formValuesUpdate({ jobBond: event.target.value })}
                    type="number"
                    value={formFields.jobBond}
                />
            ) : (
                <span>
                    <h3>Job bond</h3>

                    <span>
                        {`${multicallContract.jobBond !== "" ? toNEAR(multicallContract.jobBond) : "..."} ${
                            NearIcons.NATIVE_TOKEN_CHARACTER
                        }`}
                    </span>
                </span>
            )}
        </Tile>
    );
};
