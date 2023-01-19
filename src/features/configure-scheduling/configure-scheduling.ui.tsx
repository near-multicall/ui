import { CancelOutlined, EditOutlined, VisibilityOutlined } from "@mui/icons-material";
import { IconButton, TextField, TextFieldProps } from "@mui/material";
import { HTMLProps, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { ArgsString } from "../../shared/lib/args-old";
import { Multicall } from "../../shared/lib/contracts/multicall";
import { toNEAR, toYocto } from "../../shared/lib/converter";
import { IconLabel, NEARIcon, Table, Tile, Tooltip } from "../../shared/ui/design";
import { MI } from "../../entities";

import "./configure-scheduling.ui.scss";

const _ConfigureScheduling = "ConfigureScheduling";

type MISchedulingSettingsDiff = Pick<Multicall, "jobBond">;

interface ConfigureSchedulingUIProps extends Omit<HTMLProps<HTMLDivElement>, "onChange"> {
    onEdit: (diff: MISchedulingSettingsDiff) => void;
    resetTrigger: { subscribe: (callback: EventListener) => () => void };
}

export const ConfigureSchedulingUI = ({ disabled, onEdit, resetTrigger }: ConfigureSchedulingUIProps) => {
    const multicallInstance = useContext(MI.Context);

    const error =
        multicallInstance.data.ready && multicallInstance.data.jobBond === ""
            ? new Error("Error while getting Multicall Instance job bond")
            : null;

    const [editModeEnabled, editModeSwitch] = useState(false);

    const formInitialState: MISchedulingSettingsDiff = {
        jobBond: "",
    };

    const [jobBond, jobBondUpdate] = useState(formInitialState.jobBond);

    const formFields = {
        jobBond: useMemo(
            () => new ArgsString(multicallInstance.data.jobBond !== "" ? toNEAR(multicallInstance.data.jobBond) : ""),

            [multicallInstance.data]
        ),
    };

    const onJobBondChange = useCallback<Required<TextFieldProps>["onChange"]>(
        ({ target: { value } }) =>
            void jobBondUpdate(
                value !== toNEAR(multicallInstance.data.jobBond) ? toYocto(value) : formInitialState.jobBond
            ),

        [jobBondUpdate, multicallInstance.data]
    );

    const formReset = useCallback(() => {
        formFields.jobBond.value = toNEAR(multicallInstance.data.jobBond);

        void jobBondUpdate(formInitialState.jobBond);
        void editModeSwitch(false);
    }, [editModeSwitch, formInitialState, jobBondUpdate]);

    useEffect(() => resetTrigger.subscribe(formReset), [formReset, resetTrigger]);
    useEffect(() => void onEdit({ jobBond }), [jobBond, onEdit]);

    return (
        <Tile
            classes={{ root: _ConfigureScheduling }}
            heading="Scheduling"
            headerSlots={{
                end: editModeEnabled ? (
                    <>
                        <Tooltip content="Cancel & Reset">
                            <IconButton onClick={formReset}>
                                <CancelOutlined />
                            </IconButton>
                        </Tooltip>

                        {jobBond.length > 0 && (
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
                        ({ jobBond }[id] === formInitialState[id as keyof MISchedulingSettingsDiff] ||
                        { jobBond }[id] === multicallInstance.data[id as keyof MISchedulingSettingsDiff]
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
                        id: "jobBond",

                        content: [
                            MI.SettingsDiffMeta.jobBond.description,

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
