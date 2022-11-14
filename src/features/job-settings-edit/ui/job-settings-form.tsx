import { CancelOutlined, EditOutlined, VisibilityOutlined } from "@mui/icons-material";
import { IconButton, TextField, TextFieldProps } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ArgsString } from "../../../shared/lib/args-old";
import { toNEAR, toYocto } from "../../../shared/lib/converter";
import { IconLabel, NearIcon, NearLink, Table, Tile, Tooltip } from "../../../shared/ui/components";
import { JobSettingsEditConfig, type JobSettingsEditFeature } from "../config";

interface JobSettingsFormProps extends JobSettingsEditFeature.Inputs {}

export const JobSettingsForm = ({
    className,
    disabled,
    multicallContract,
    onEdit,
    resetTrigger,
}: JobSettingsFormProps) => {
    const [editModeEnabled, editModeSwitch] = useState(false);

    const formInitialState: JobSettingsEditFeature.FormState = {
        [JobSettingsEditConfig.ChangesDiffKey.croncatManager]: "",
        [JobSettingsEditConfig.ChangesDiffKey.jobBond]: "",
    };

    const [[croncatManager, croncatManagerUpdate], [jobBond, jobBondUpdate]] = [
        useState<JobSettingsEditFeature.FormState["croncatManager"]>(formInitialState.croncatManager),
        useState<JobSettingsEditFeature.FormState["jobBond"]>(formInitialState.jobBond),
    ];

    const formFields = {
        croncatManager: useMemo(() => new ArgsString(multicallContract.croncatManager), [multicallContract]),

        jobBond: useMemo(
            () => new ArgsString(multicallContract.jobBond !== "" ? toNEAR(multicallContract.jobBond) : ""),
            [multicallContract]
        ),
    };

    const onCroncatManagerChange = useCallback<Required<TextFieldProps>["onChange"]>(
        ({ target: { value } }) =>
            void croncatManagerUpdate(
                value !== multicallContract.croncatManager ? value : formInitialState.croncatManager
            ),

        [croncatManagerUpdate]
    );

    const onJobBondChange = useCallback<Required<TextFieldProps>["onChange"]>(
        ({ target: { value } }) =>
            void jobBondUpdate(value !== toNEAR(multicallContract.jobBond) ? toYocto(value) : formInitialState.jobBond),

        [jobBondUpdate]
    );

    const formReset = useCallback(() => {
        formFields.croncatManager.value = multicallContract.croncatManager;
        formFields.jobBond.value = toNEAR(multicallContract.jobBond);

        void croncatManagerUpdate(formInitialState.croncatManager);
        void jobBondUpdate(formInitialState.jobBond);
        void editModeSwitch(false);
    }, [croncatManagerUpdate, editModeSwitch, formInitialState, jobBondUpdate]);

    useEffect(() => resetTrigger.subscribe(formReset), [formReset, resetTrigger]);

    useEffect(() => void onEdit({ croncatManager, jobBond }), [croncatManager, jobBond, onEdit]);

    return (
        <Tile
            classes={{ root: className }}
            heading="Jobs settings"
            headingCorners={{
                end: editModeEnabled ? (
                    <>
                        {(croncatManager.length > 0 || jobBond.length > 0) && (
                            <IconButton onClick={() => void editModeSwitch(false)}>
                                <VisibilityOutlined />
                            </IconButton>
                        )}

                        <IconButton onClick={formReset}>
                            <CancelOutlined />
                        </IconButton>
                    </>
                ) : (
                    <Tooltip content={disabled ? "You are in read-only mode" : "Propose changes"}>
                        <span>
                            <IconButton
                                onClick={() => void editModeSwitch(true)}
                                {...{ disabled }}
                            >
                                <EditOutlined />
                            </IconButton>
                        </span>
                    </Tooltip>
                ),
            }}
        >
            <Table
                RowProps={{
                    centeredTitle: true,

                    idToHighlightColor: (id) =>
                        ({ croncatManager, jobBond }[id] ===
                            formInitialState[id as JobSettingsEditFeature.ChangesDiffKey] ||
                        { croncatManager, jobBond }[id] ===
                            multicallContract[id as JobSettingsEditFeature.ChangesDiffKey]
                            ? null
                            : "blue"),

                    entitled: true,
                    noKeys: true,
                }}
                displayMode="compact"
                dense
                header={["Option", "Value"]}
                rows={[
                    {
                        id: JobSettingsEditConfig.ChangesDiffKey.croncatManager,

                        content: [
                            JobSettingsEditConfig.ChangesDiffMetadata[
                                JobSettingsEditConfig.ChangesDiffKey.croncatManager
                            ].description,

                            editModeEnabled ? (
                                <TextField
                                    fullWidth
                                    onChange={onCroncatManagerChange}
                                    value={croncatManager || multicallContract.croncatManager}
                                />
                            ) : (
                                <NearLink address={croncatManager || multicallContract.croncatManager} />
                            ),
                        ],
                    },
                    {
                        id: JobSettingsEditConfig.ChangesDiffKey.jobBond,

                        content: [
                            JobSettingsEditConfig.ChangesDiffMetadata[JobSettingsEditConfig.ChangesDiffKey.jobBond]
                                .description,

                            editModeEnabled ? (
                                <TextField
                                    InputProps={{
                                        endAdornment: NearIcon.NATIVE_TOKEN_CHARACTER,
                                        inputProps: { min: 0, step: 0.001 },
                                    }}
                                    fullWidth
                                    onChange={onJobBondChange}
                                    type="number"
                                    value={toNEAR(jobBond || multicallContract.jobBond)}
                                />
                            ) : (
                                <IconLabel
                                    icon={NearIcon.NATIVE_TOKEN_CHARACTER}
                                    label={
                                        jobBond || multicallContract.jobBond !== ""
                                            ? toNEAR(jobBond || multicallContract.jobBond)
                                            : "..."
                                    }
                                    reversed
                                />
                            ),
                        ],
                    },
                ]}
            />
        </Tile>
    );
};
