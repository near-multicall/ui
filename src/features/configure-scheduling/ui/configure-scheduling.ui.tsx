import { CancelOutlined, EditOutlined } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { Form, Formik } from "formik";
import { HTMLProps, useCallback, useContext, useEffect, useState } from "react";
import { InferType } from "yup";

import { args } from "../../../shared/lib/args/args";
import { Multicall } from "../../../shared/lib/contracts/multicall";
import { toNEAR, toYocto } from "../../../shared/lib/converter";
import { Props } from "../../../shared/lib/props";
import { TextField } from "../../../shared/ui/form";
import { NEARIcon, Table, Tile, Tooltip } from "../../../shared/ui/design";
import { MulticallInstance } from "../../../entities";

import "./configure-scheduling.ui.scss";

const _ConfigureScheduling = "ConfigureScheduling";

type MISchedulingSettingsDiff = Pick<Multicall, "jobBond">;

interface ConfigureSchedulingUIProps extends Omit<HTMLProps<HTMLDivElement>, "onChange"> {
    onEdit: (diff: MISchedulingSettingsDiff) => void;
    resetTrigger: { subscribe: (callback: EventListener) => () => void };
}

export const ConfigureSchedulingUI = ({ disabled, onEdit, resetTrigger }: ConfigureSchedulingUIProps) => {
    const [editModeEnabled, editModeSwitch] = useState(false),
        mi = useContext(MulticallInstance.Context);

    const error =
        mi.data.ready && mi.data.jobBond === ""
            ? new Error("Error while getting Multicall Instance job bond")
            : mi.error;

    const schema = args.object().shape({
        jobBond: args.string().default(mi.data.ready ? toNEAR(mi.data.jobBond) : "0.001"),
    });

    type Schema = InferType<typeof schema>;

    const onReset = useCallback(() => {
        void editModeSwitch(false);
    }, [editModeSwitch]);

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

    console.log({ jobBond: mi.data.jobBond });

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
                        header={[MulticallInstance.SettingsDiffMeta.jobBond.description]}
                        rows={[
                            {
                                id: "jobBond",

                                content: [
                                    <TextField
                                        InputProps={{
                                            endAdornment: NEARIcon.NativeTokenCharacter,
                                            inputProps: { min: 0, step: 0.001 },
                                        }}
                                        disabled={!editModeEnabled}
                                        fullWidth
                                        invertedColors
                                        name="jobBond"
                                        type="number"
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
