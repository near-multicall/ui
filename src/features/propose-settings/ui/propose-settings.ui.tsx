import clsx from "clsx";
import { Form, Formik, FormikHelpers } from "formik";
import { HTMLProps, useCallback, useContext } from "react";
import { InferType } from "yup";

import { args } from "../../../shared/lib/args/args";
import { Multicall } from "../../../shared/lib/contracts/multicall";
import { SputnikDAO } from "../../../shared/lib/contracts/sputnik-dao";
import { toNEAR } from "../../../shared/lib/converter";
import { signAndSendTxs } from "../../../shared/lib/wallet";
import { Button, ButtonGroup, NEARIcon, Tile } from "../../../shared/ui/design";
import { TextField } from "../../../shared/ui/form";
import { MulticallInstance } from "../../../entities";

import "./propose-settings.ui.scss";

const _ProposeSettings = "ProposeSettings";

type MISettingsDiff = Arguments<typeof Multicall["configDiffToProposalActions"]>[0];

export interface ProposeSettingsUIProps extends HTMLProps<HTMLDivElement> {
    dao: SputnikDAO;
    diff: MISettingsDiff;
    editMode: boolean;
    onCancel: VoidFunction;
}

export const ProposeSettingsUI = ({ className, dao, diff, disabled, editMode, onCancel }: ProposeSettingsUIProps) => {
    const multicallInstance = useContext(MulticallInstance.Context);

    const schema = args.object().shape({
        description: args.string().default("").required("Proposal description is required"),
    });

    type Schema = InferType<typeof schema>;

    const onReset = useCallback(
        (_values: Schema, { setValues }: FormikHelpers<Schema>) => {
            setValues(schema.getDefault());
            onCancel();
        },
        [onCancel]
    );

    const onSubmit = useCallback(
        ({ description }: Schema) =>
            void dao
                .proposeFunctionCall(
                    description,
                    multicallInstance.data.address,
                    Multicall.configDiffToProposalActions(diff)
                )
                .then((someTx) => signAndSendTxs([someTx]))
                .catch(console.error),
        [dao, diff]
    );

    return (
        <Formik
            initialValues={schema.getDefault()}
            validationSchema={schema}
            {...{ onReset, onSubmit }}
        >
            <Tile
                classes={{
                    content: clsx(_ProposeSettings, { "is-inEditMode": Boolean(editMode) }, className),
                }}
                heading={editMode ? "Summary" : null}
            >
                <p className={`${_ProposeSettings}-hint`}>
                    {disabled
                        ? "Current account has no permission to propose changes"
                        : "Start editing to create config changes proposal template"}
                </p>

                <div className={`${_ProposeSettings}-summary`}>
                    {Object.entries(MulticallInstance.SettingsDiffMeta).map(
                        ([key, { color, description }]) =>
                            diff[key as keyof MISettingsDiff].length > 0 && (
                                <div
                                    className={`${_ProposeSettings}-summary-entry`}
                                    {...{ key }}
                                >
                                    <h3 className={`${_ProposeSettings}-summary-entry-description`}>
                                        {description + ":"}
                                    </h3>

                                    <ul className={`${_ProposeSettings}-summary-entry-data`}>
                                        {(Array.isArray(diff[key as keyof MISettingsDiff])
                                            ? Array.from(diff[key as keyof MISettingsDiff])
                                            : [diff[key as keyof MISettingsDiff]]
                                        ).map((data) => (
                                            <li
                                                className={clsx(
                                                    `${_ProposeSettings}-summary-entry-data-chip`,
                                                    `${_ProposeSettings}-summary-entry-data-chip--${color}`
                                                )}
                                                key={data as string}
                                            >
                                                {!Number.isNaN(data) && key === "jobBond"
                                                    ? `${toNEAR(data as string)} ${NEARIcon.NativeTokenCharacter}`
                                                    : (data as string)}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )
                    )}
                </div>

                <Form className={`${_ProposeSettings}-submit`}>
                    <div>
                        <TextField
                            invertedColors
                            fullWidth
                            label="Description"
                            minRows={2}
                            multiline
                            name="description"
                            required
                        />
                    </div>

                    <ButtonGroup>
                        <Button
                            color="error"
                            label="Cancel"
                            type="reset"
                        />

                        <Button
                            color="success"
                            disabled={!(Object.values(diff).filter(({ length }) => length > 0).length > 0)}
                            label="Submit"
                            type="submit"
                        />
                    </ButtonGroup>
                </Form>
            </Tile>
        </Formik>
    );
};