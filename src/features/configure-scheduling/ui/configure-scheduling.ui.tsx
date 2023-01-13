import { CancelOutlined, EditOutlined } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { Form, Formik } from "formik";
import { HTMLProps, useCallback, useContext, useEffect, useState } from "react";
import { InferType } from "yup";

import { args } from "../../../shared/lib/args/args";
import { Multicall } from "../../../shared/lib/contracts/multicall";
import { Big, toNEAR, toYocto } from "../../../shared/lib/converter";
import { Props } from "../../../shared/lib/props";
import { TextField } from "../../../shared/ui/form";
import { IconLabel, NEARIcon, Table, Tile, Tooltip } from "../../../shared/ui/design";
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
        jobBond: args
            .big()
            .token()
            .default(Big(toNEAR(mi.data.jobBond))),
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
        [editModeSwitch, onEdit]
    );

    useEffect(() => resetTrigger.subscribe(onReset), [onReset, resetTrigger]);

    const jobBond = false; // TODO: get jobBond from the form

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
                        RowProps={{
                            centeredTitle: true,
                            idToHighlight: (id) => (id === "jobBond" ? null : "blue"),
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
                                    MulticallInstance.SettingsDiffMeta.jobBond.description,

                                    editModeEnabled ? (
                                        <TextField
                                            InputProps={{
                                                endAdornment: NEARIcon.NativeTokenCharacter,
                                                inputProps: { min: 0, step: 0.001 },
                                            }}
                                            fullWidth
                                            name="jobBond"
                                            type="number"
                                        />
                                    ) : (
                                        <IconLabel
                                            icon={NEARIcon.NativeTokenCharacter}
                                            label={
                                                jobBond || mi.data.jobBond !== ""
                                                    ? toNEAR(jobBond || mi.data.jobBond)
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
            </Form>
        </Formik>
    );
};
