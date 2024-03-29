import { CancelOutlined, EditOutlined, VisibilityOutlined } from "@mui/icons-material";
import { IconButton, TextField, TextFieldProps } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ArgsString } from "../../../../shared/lib/args-old";
import { toNEAR, toYocto } from "../../../../shared/lib/converter";
import { IconLabel, NearIcon, NearLink, Table, Tile, Tooltip } from "../../../../shared/ui/design";
import { ModuleContext, SchedulingSettingsChange } from "../context";

export const SchedulingSettingsForm = ({
    className,
    disabled,
    multicallInstance,
    onEdit,
    resetTrigger,
}: SchedulingSettingsChange.Inputs) => {
    const [editModeEnabled, editModeSwitch] = useState(false);

    const formInitialState: SchedulingSettingsChange.FormState = {
        [ModuleContext.DiffKey.croncatManager]: "",
        [ModuleContext.DiffKey.jobBond]: "",
    };

    const [[croncatManager, croncatManagerUpdate], [jobBond, jobBondUpdate]] = [
        useState<SchedulingSettingsChange.FormState["croncatManager"]>(formInitialState.croncatManager),
        useState<SchedulingSettingsChange.FormState["jobBond"]>(formInitialState.jobBond),
    ];

    const formFields = {
        croncatManager: useMemo(() => new ArgsString(multicallInstance.croncatManager), [multicallInstance]),

        jobBond: useMemo(
            () => new ArgsString(multicallInstance.jobBond !== "" ? toNEAR(multicallInstance.jobBond) : ""),
            [multicallInstance]
        ),
    };

    const onCroncatManagerChange = useCallback<Required<TextFieldProps>["onChange"]>(
        ({ target: { value } }) =>
            void croncatManagerUpdate(
                value !== multicallInstance.croncatManager ? value : formInitialState.croncatManager
            ),

        [croncatManagerUpdate]
    );

    const onJobBondChange = useCallback<Required<TextFieldProps>["onChange"]>(
        ({ target: { value } }) =>
            void jobBondUpdate(value !== toNEAR(multicallInstance.jobBond) ? toYocto(value) : formInitialState.jobBond),

        [jobBondUpdate]
    );

    const formReset = useCallback(() => {
        formFields.croncatManager.value = multicallInstance.croncatManager;
        formFields.jobBond.value = toNEAR(multicallInstance.jobBond);

        void croncatManagerUpdate(formInitialState.croncatManager);
        void jobBondUpdate(formInitialState.jobBond);
        void editModeSwitch(false);
    }, [croncatManagerUpdate, editModeSwitch, formInitialState, jobBondUpdate]);

    useEffect(() => resetTrigger.subscribe(formReset), [formReset, resetTrigger]);

    useEffect(() => void onEdit({ croncatManager, jobBond }), [croncatManager, jobBond, onEdit]);

    return (
        <Tile
            classes={{ root: className }}
            heading="Scheduling"
            headerSlots={{
                end: editModeEnabled ? (
                    <>
                        <Tooltip content="Preview">
                            <IconButton onClick={() => void editModeSwitch(false)}>
                                <VisibilityOutlined />
                            </IconButton>
                        </Tooltip>

                        {(croncatManager.length > 0 || jobBond.length > 0) && (
                            <Tooltip content="Cancel & Reset">
                                <IconButton onClick={formReset}>
                                    <CancelOutlined />
                                </IconButton>
                            </Tooltip>
                        )}
                    </>
                ) : (
                    <Tooltip content={disabled ? "You are in read-only mode" : "Propose changes"}>
                        <IconButton
                            onClick={() => void editModeSwitch(true)}
                            {...{ disabled }}
                        >
                            <EditOutlined />
                        </IconButton>
                    </Tooltip>
                ),
            }}
        >
            <Table
                RowProps={{
                    centeredTitle: true,

                    idToHighlightColor: (id) =>
                        ({ croncatManager, jobBond }[id] === formInitialState[id as SchedulingSettingsChange.DiffKey] ||
                        { croncatManager, jobBond }[id] === multicallInstance[id as SchedulingSettingsChange.DiffKey]
                            ? null
                            : "blue"),

                    withTitle: true,
                    noKeys: true,
                }}
                displayMode="compact"
                dense
                header={["Option", "Value"]}
                rows={[
                    {
                        id: ModuleContext.DiffKey.croncatManager,

                        content: [
                            ModuleContext.DiffMeta[ModuleContext.DiffKey.croncatManager].description,

                            editModeEnabled ? (
                                <TextField
                                    fullWidth
                                    onChange={onCroncatManagerChange}
                                    value={croncatManager || multicallInstance.croncatManager}
                                />
                            ) : (
                                <NearLink address={croncatManager || multicallInstance.croncatManager} />
                            ),
                        ],
                    },
                    {
                        id: ModuleContext.DiffKey.jobBond,

                        content: [
                            ModuleContext.DiffMeta[ModuleContext.DiffKey.jobBond].description,

                            editModeEnabled ? (
                                <TextField
                                    InputProps={{
                                        endAdornment: NearIcon.NATIVE_TOKEN_CHARACTER,
                                        inputProps: { min: 0, step: 0.001 },
                                    }}
                                    fullWidth
                                    onChange={onJobBondChange}
                                    type="number"
                                    value={toNEAR(jobBond || multicallInstance.jobBond)}
                                />
                            ) : (
                                <IconLabel
                                    icon={NearIcon.NATIVE_TOKEN_CHARACTER}
                                    label={
                                        jobBond || multicallInstance.jobBond !== ""
                                            ? toNEAR(jobBond || multicallInstance.jobBond)
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
