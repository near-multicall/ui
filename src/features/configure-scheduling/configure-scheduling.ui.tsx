import { CancelOutlined, EditOutlined } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { Form, Formik } from "formik";
import { HTMLProps, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { InferType } from "yup";

import { MI } from "../../entities";
import { args } from "../../shared/lib/args/args";
import { Multicall } from "../../shared/lib/contracts/multicall";
import { toNEAR, toYocto } from "../../shared/lib/converter";
import { Props } from "../../shared/lib/props";
import { TextField } from "../../shared/ui/form";
import { NEARIcon, Table, Tile, Tooltip } from "../../shared/ui/design";

import { ConfigureSchedulingParams } from "./params";
import "./configure-scheduling.ui.scss";

const _ConfigureScheduling = "ConfigureScheduling";

type MISchedulingSettingsDiff = Pick<Multicall, "jobBond">;

interface ConfigureSchedulingUIProps extends Omit<HTMLProps<HTMLDivElement>, "onChange"> {
    onEdit: (diff: MISchedulingSettingsDiff) => void;
    resetTrigger: { subscribe: (callback: EventListener) => () => void };
}

export const ConfigureSchedulingUI = ({ disabled, onEdit, resetTrigger }: ConfigureSchedulingUIProps) => {
    const [editModeEnabled, editModeSwitch] = useState(false),
        mi = useContext(MI.Context),
        jobBondInitial = mi.data.ready ? toNEAR(mi.data.jobBond) : ConfigureSchedulingParams.minJobBondNEAR.toString();

    const error =
        mi.data.ready && mi.data.jobBond === ""
            ? new Error("Error while getting Multicall Instance job bond")
            : mi.error;

    const schema = args.object().shape({
        jobBond: args.string().default(jobBondInitial),
    });

    type Schema = InferType<typeof schema>;

    const onReset = useCallback(() => editModeSwitch(false), [editModeSwitch]);

    const onSubmit = useCallback(
        (values: Schema) => {
            onEdit(
                Props.evolve(
                    { jobBond: (amount) => (amount !== toNEAR(mi.data.jobBond) ? toYocto(amount) : "") },
                    values
                )
            );

            editModeSwitch(false);
        },
        [editModeSwitch, mi.data, onEdit]
    );

    useEffect(() => resetTrigger.subscribe(onReset), [onReset, resetTrigger]);

    return (
        <Formik
            initialValues={schema.getDefault()}
            validationSchema={schema}
            {...{ onReset, onSubmit }}
        >
            <Form className={_ConfigureScheduling}>
                <Tile
                    classes={{ root: `${_ConfigureScheduling}-controls` }}
                    heading="Scheduling"
                    headerSlots={{
                        end: editModeEnabled ? (
                            <Tooltip content="Cancel & Reset">
                                <IconButton type="reset">
                                    <CancelOutlined />
                                </IconButton>
                            </Tooltip>
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
                        RowProps={{ idToHighlight: (id) => (id === "jobBond" ? null : "blue") }}
                        displayMode="compact"
                        dense
                        header={[MI.SettingsDiffMeta.jobBond.description]}
                        rows={[
                            {
                                id: "jobBond",

                                content: [
                                    <TextField
                                        InputProps={{
                                            endAdornment: NEARIcon.NativeTokenCharacter,
                                            inputProps: { min: ConfigureSchedulingParams.minJobBondNEAR, step: 0.001 },
                                        }}
                                        disabled={!editModeEnabled}
                                        fullWidth
                                        invertedColors
                                        name="jobBond"
                                        type="number"
                                        value={jobBondInitial}
                                    />,
                                ],
                            },
                        ]}
                    />
                </Tile>
            </Form>
        </Formik>
    );
};
