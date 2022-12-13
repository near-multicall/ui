import { CancelOutlined, EditOutlined, VisibilityOutlined } from "@mui/icons-material";
import { IconButton, TextField, TextFieldProps } from "@mui/material";
import { HTMLProps, useCallback, useEffect, useMemo, useState } from "react";

import { MulticallInstance } from "../../../../entities";
import { ArgsString } from "../../../../shared/lib/args-old";
import { MulticallSettingsChange, MulticallPropertyKey } from "../../../../shared/lib/contracts/multicall";
import { toNEAR, toYocto } from "../../../../shared/lib/converter";
import { IconLabel, NearIcon, NearLink, Table, Tile, Tooltip } from "../../../../shared/ui/design";
import { ModuleContext } from "../module-context";

import "./scheduling-settings-change.scss";

const _SchedulingSettingsChange = "SchedulingSettingsChange";

type FormState = Pick<MulticallSettingsChange, MulticallPropertyKey>;

interface SchedulingSettingsChangeUIProps extends Omit<HTMLProps<HTMLDivElement>, "onChange"> {
    onEdit: (payload: FormState) => void;
    resetTrigger: { subscribe: (callback: EventListener) => () => void };
}

export const SchedulingSettingsChangeUI = ({ disabled, onEdit, resetTrigger }: SchedulingSettingsChangeUIProps) => {
    const { data: MIProperties } = MulticallInstance.useProperties();

    const [editModeEnabled, editModeSwitch] = useState(false);

    const formInitialState: FormState = {
        [ModuleContext.DiffKey.croncatManager]: "",
        [ModuleContext.DiffKey.jobBond]: "",
    };

    const [[croncatManager, croncatManagerUpdate], [jobBond, jobBondUpdate]] = [
        useState<typeof formInitialState["croncatManager"]>(formInitialState.croncatManager),
        useState<typeof formInitialState["jobBond"]>(formInitialState.jobBond),
    ];

    const formFields = {
        croncatManager: useMemo(() => new ArgsString(MIProperties.croncatManager), [MIProperties]),

        jobBond: useMemo(
            () => new ArgsString(MIProperties.jobBond !== "" ? toNEAR(MIProperties.jobBond) : ""),

            [MIProperties]
        ),
    };

    const onCroncatManagerChange = useCallback<Required<TextFieldProps>["onChange"]>(
        ({ target: { value } }) =>
            void croncatManagerUpdate(value !== MIProperties.croncatManager ? value : formInitialState.croncatManager),

        [croncatManagerUpdate]
    );

    const onJobBondChange = useCallback<Required<TextFieldProps>["onChange"]>(
        ({ target: { value } }) =>
            void jobBondUpdate(value !== toNEAR(MIProperties.jobBond) ? toYocto(value) : formInitialState.jobBond),

        [jobBondUpdate]
    );

    const formReset = useCallback(() => {
        formFields.croncatManager.value = MIProperties.croncatManager;
        formFields.jobBond.value = toNEAR(MIProperties.jobBond);

        void croncatManagerUpdate(formInitialState.croncatManager);
        void jobBondUpdate(formInitialState.jobBond);
        void editModeSwitch(false);
    }, [croncatManagerUpdate, editModeSwitch, formInitialState, jobBondUpdate]);

    useEffect(() => resetTrigger.subscribe(formReset), [formReset, resetTrigger]);
    useEffect(() => void onEdit({ croncatManager, jobBond }), [croncatManager, jobBond, onEdit]);

    return (
        <Tile
            classes={{ root: _SchedulingSettingsChange }}
            heading="Scheduling"
            headerSlots={{
                end: editModeEnabled ? (
                    <>
                        <Tooltip content="Cancel & Reset">
                            <IconButton onClick={formReset}>
                                <CancelOutlined />
                            </IconButton>
                        </Tooltip>

                        {(croncatManager.length > 0 || jobBond.length > 0) && (
                            <Tooltip content="Preview">
                                <IconButton onClick={() => void editModeSwitch(false)}>
                                    <VisibilityOutlined />
                                </IconButton>
                            </Tooltip>
                        )}
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
                            formInitialState[id as keyof typeof ModuleContext["DiffKey"]] ||
                        { croncatManager, jobBond }[id] === MIProperties[id as keyof typeof ModuleContext["DiffKey"]]
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
                                    value={croncatManager || MIProperties.croncatManager}
                                />
                            ) : (
                                <NearLink address={croncatManager || MIProperties.croncatManager} />
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
                                    value={toNEAR(jobBond || MIProperties.jobBond)}
                                />
                            ) : (
                                <IconLabel
                                    icon={NearIcon.NATIVE_TOKEN_CHARACTER}
                                    label={
                                        jobBond || MIProperties.jobBond !== ""
                                            ? toNEAR(jobBond || MIProperties.jobBond)
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
