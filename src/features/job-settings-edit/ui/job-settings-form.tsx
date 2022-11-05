import { CancelOutlined, EditOutlined, VisibilityOutlined } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ArgsString } from "../../../shared/lib/args";
import { toNEAR, toYocto } from "../../../shared/lib/converter";
import { IconLabel, NearIcons, NearLink, Table, TextInput, TextInputProps, Tile } from "../../../shared/ui/components";
import { JobSettingsEditConfig, type JobSettingsEditFeature } from "../config";

interface JobSettingsFormProps extends JobSettingsEditFeature.Dependencies {}

export const JobSettingsForm = ({
    className,
    disabled,
    multicallContract,
    onEdit,
    resetTrigger,
}: JobSettingsFormProps) => {
    const [editModeEnabled, editModeSwitch] = useState(!disabled);

    const formInitialState: JobSettingsEditFeature.FormState = {
        [JobSettingsEditConfig.DiffKey.croncatManager]: "",
        [JobSettingsEditConfig.DiffKey.jobBond]: "",
    };

    const [[croncatManager, croncatManagerUpdate], [jobBond, jobBondUpdate]] = [
        useState<JobSettingsEditFeature.FormState["croncatManager"]>(formInitialState.croncatManager),
        useState<JobSettingsEditFeature.FormState["jobBond"]>(formInitialState.jobBond),
    ];

    const formFields = {
        croncatManager: useMemo(() => new ArgsString(multicallContract.croncatManager), [disabled, multicallContract]),

        jobBond: useMemo(
            () => new ArgsString(multicallContract.jobBond !== "" ? toNEAR(multicallContract.jobBond) : ""),
            [disabled, multicallContract]
        ),
    };

    const onCroncatManagerChange = useCallback<Required<TextInputProps>["update"]>(
        ({ target: { value } }) =>
            void croncatManagerUpdate(
                value !== multicallContract.croncatManager ? value : formInitialState.croncatManager
            ),

        [croncatManagerUpdate]
    );

    const onJobBondChange = useCallback<Required<TextInputProps>["update"]>(
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
                    <IconButton onClick={() => void editModeSwitch(true)}>
                        <EditOutlined />
                    </IconButton>
                ),
            }}
        >
            <Table
                RowProps={{
                    centeredTitle: true,

                    idToHighlightColor: (id) =>
                        ({ croncatManager, jobBond }[id] === formInitialState[id as JobSettingsEditFeature.DiffKey] ||
                        { croncatManager, jobBond }[id] === multicallContract[id as JobSettingsEditFeature.DiffKey]
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
                        id: JobSettingsEditConfig.DiffKey.croncatManager,

                        content: [
                            "Croncat manager",

                            editModeEnabled ? (
                                <TextInput
                                    fullWidth
                                    update={onCroncatManagerChange}
                                    value={formFields.croncatManager}
                                />
                            ) : (
                                <NearLink address={croncatManager || multicallContract.croncatManager} />
                            ),
                        ],
                    },
                    {
                        id: JobSettingsEditConfig.DiffKey.jobBond,

                        content: [
                            "Job bond",

                            editModeEnabled ? (
                                <TextInput
                                    InputProps={{
                                        endAdornment: NearIcons.NATIVE_TOKEN_CHARACTER,
                                        inputProps: { min: 0, step: 0.001 },
                                    }}
                                    fullWidth
                                    update={onJobBondChange}
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
