import clsx from "clsx";
import { Form, Formik, FormikHelpers } from "formik";
import { HTMLProps, useCallback, useContext } from "react";
import { InferType } from "yup";

import { args } from "../../shared/lib/args/args";
import { Multicall } from "../../shared/lib/contracts/multicall";
import { SputnikDAO } from "../../shared/lib/contracts/sputnik-dao";
import { toNEAR } from "../../shared/lib/converter";
import { signAndSendTxs } from "../../shared/lib/wallet";
import { Button, ButtonGroup, NEARIcon, Tile } from "../../shared/ui/design";
import { TextField } from "../../shared/ui/form";
import { MI } from "../../entities";

import "./propose-settings.ui.scss";

type MISettingsDiff = Arguments<(typeof Multicall)["configDiffToProposalActions"]>[0];

export interface ProposeSettingsUIProps extends HTMLProps<HTMLDivElement> {
    dao: SputnikDAO;
    diff: MISettingsDiff;
    editMode: boolean;
    onCancel: VoidFunction;
}

export const ProposeSettingsUI = ({ className, dao, diff, disabled, editMode, onCancel }: ProposeSettingsUIProps) => {
    const mi = useContext(MI.Context);

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
                .proposeFunctionCall(description, mi.data.address, Multicall.configDiffToProposalActions(diff))
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
                    content: clsx("ProposeSettings", { "is-inEditMode": Boolean(editMode) }, className),
                }}
                heading={editMode ? "Summary" : null}
                {...mi}
            >
                <p className="ProposeSettings-hint">
                    {disabled
                        ? "Your account has no permission to create proposals"
                        : "Start editing to draft changes proposal"}
                </p>

                <div className="ProposeSettings-summary">
                    {Object.entries(MI.SettingsDiffMeta).map(
                        ([key, { color, description }]) =>
                            diff[key as keyof MISettingsDiff].length > 0 && (
                                <div
                                    className="ProposeSettings-summary-entry"
                                    {...{ key }}
                                >
                                    <h3 className="ProposeSettings-summary-entry-description">{description + ":"}</h3>

                                    <ul className="ProposeSettings-summary-entry-data">
                                        {(Array.isArray(diff[key as keyof MISettingsDiff])
                                            ? Array.from(diff[key as keyof MISettingsDiff])
                                            : [diff[key as keyof MISettingsDiff]]
                                        ).map((data) => (
                                            <li
                                                className={clsx(
                                                    "ProposeSettings-summary-entry-data-chip",
                                                    `ProposeSettings-summary-entry-data-chip--${color}`
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

                <Form className="ProposeSettings-submit">
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
