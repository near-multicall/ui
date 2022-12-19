import { CancelOutlined, EditOutlined, VisibilityOutlined } from "@mui/icons-material";
import { IconButton, TextField, TextFieldProps } from "@mui/material";
import { HTMLProps, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { MulticallSettingsChange, MulticallPropertyKey } from "../../../shared/lib/contracts/multicall";
import { ArgsString } from "../../../shared/lib/args-old";
import { toNEAR, toYocto } from "../../../shared/lib/converter";
import { IconLabel, NEARIcon, NEARLink, Table, Tile, Tooltip } from "../../../shared/ui/design";
import { MulticallInstance } from "../../../entities";

import "./manage-scheduling-settings.ui.scss";

const _ManageScheduleSettings = "ManageScheduleSettings";

type FormState = Pick<MulticallSettingsChange, MulticallPropertyKey>;

interface ManageScheduleSettingsUIProps extends Omit<HTMLProps<HTMLDivElement>, "onChange"> {
    onEdit: (payload: FormState) => void;
    resetTrigger: { subscribe: (callback: EventListener) => () => void };
}

export const ManageScheduleSettingsUI = ({ disabled, onEdit, resetTrigger }: ManageScheduleSettingsUIProps) => {
    const multicallInstance = useContext(MulticallInstance.Context);

    const error =
        multicallInstance.data.ready && multicallInstance.data.jobBond === ""
            ? new Error("Error while getting Multicall Instance job bond")
            : null;

    const [editModeEnabled, editModeSwitch] = useState(false);

    const formInitialState: FormState = {
        [MulticallPropertyKey.croncatManager]: "",
        [MulticallPropertyKey.jobBond]: "",
    };

    const [[croncatManager, croncatManagerUpdate], [jobBond, jobBondUpdate]] = [
        useState<typeof formInitialState["croncatManager"]>(formInitialState.croncatManager),
        useState<typeof formInitialState["jobBond"]>(formInitialState.jobBond),
    ];

    const formFields = {
        croncatManager: useMemo(() => new ArgsString(multicallInstance.data.croncatManager), [multicallInstance.data]),

        jobBond: useMemo(
            () => new ArgsString(multicallInstance.data.jobBond !== "" ? toNEAR(multicallInstance.data.jobBond) : ""),

            [multicallInstance.data]
        ),
    };

    const onCroncatManagerChange = useCallback<Required<TextFieldProps>["onChange"]>(
        ({ target: { value } }) =>
            void croncatManagerUpdate(
                value !== multicallInstance.data.croncatManager ? value : formInitialState.croncatManager
            ),

        [croncatManagerUpdate]
    );

    const onJobBondChange = useCallback<Required<TextFieldProps>["onChange"]>(
        ({ target: { value } }) =>
            void jobBondUpdate(
                value !== toNEAR(multicallInstance.data.jobBond) ? toYocto(value) : formInitialState.jobBond
            ),

        [jobBondUpdate]
    );

    const formReset = useCallback(() => {
        formFields.croncatManager.value = multicallInstance.data.croncatManager;
        formFields.jobBond.value = toNEAR(multicallInstance.data.jobBond);

        void croncatManagerUpdate(formInitialState.croncatManager);
        void jobBondUpdate(formInitialState.jobBond);
        void editModeSwitch(false);
    }, [croncatManagerUpdate, editModeSwitch, formInitialState, jobBondUpdate]);

    useEffect(() => resetTrigger.subscribe(formReset), [formReset, resetTrigger]);
    useEffect(() => void onEdit({ croncatManager, jobBond }), [croncatManager, jobBond, onEdit]);

    return (
        <Tile
            classes={{ root: _ManageScheduleSettings }}
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
            {...{ error }}
        >
            <Table
                RowProps={{
                    centeredTitle: true,

                    idToHighlightColor: (id) =>
                        ({ croncatManager, jobBond }[id] === formInitialState[id as MulticallPropertyKey] ||
                        { croncatManager, jobBond }[id] === multicallInstance.data[id as MulticallPropertyKey]
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
                        id: MulticallPropertyKey.croncatManager,

                        content: [
                            MulticallInstance.SettingsDiffMeta[MulticallPropertyKey.croncatManager].description,

                            editModeEnabled ? (
                                <TextField
                                    fullWidth
                                    onChange={onCroncatManagerChange}
                                    value={croncatManager || multicallInstance.data.croncatManager}
                                />
                            ) : (
                                <NEARLink address={croncatManager || multicallInstance.data.croncatManager} />
                            ),
                        ],
                    },
                    {
                        id: MulticallPropertyKey.jobBond,

                        content: [
                            MulticallInstance.SettingsDiffMeta[MulticallPropertyKey.jobBond].description,

                            editModeEnabled ? (
                                <TextField
                                    InputProps={{
                                        endAdornment: NEARIcon.NATIVE_TOKEN_CHARACTER,
                                        inputProps: { min: 0, step: 0.001 },
                                    }}
                                    fullWidth
                                    onChange={onJobBondChange}
                                    type="number"
                                    value={toNEAR(jobBond || multicallInstance.data.jobBond)}
                                />
                            ) : (
                                <IconLabel
                                    icon={NEARIcon.NATIVE_TOKEN_CHARACTER}
                                    label={
                                        jobBond || multicallInstance.data.jobBond !== ""
                                            ? toNEAR(jobBond || multicallInstance.data.jobBond)
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
