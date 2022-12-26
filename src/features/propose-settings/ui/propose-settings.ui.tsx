import clsx from "clsx";
import { Form, Formik, FormikHelpers } from "formik";
import { HTMLProps, useCallback, useContext } from "react";
import { InferType } from "yup";

import { args } from "../../../shared/lib/args/args";
import {
    Multicall,
    MulticallPropertyKey,
    MulticallSettingsChange,
    MulticallTokenWhitelistDiffKey,
} from "../../../shared/lib/contracts/multicall";
import { SputnikDAO } from "../../../shared/lib/contracts/sputnik-dao";
import { toNEAR } from "../../../shared/lib/converter";
import { signAndSendTxs } from "../../../shared/lib/wallet";
import { Button, ButtonGroup, NEARIcon, Tile } from "../../../shared/ui/design";
import { TextField } from "../../../shared/ui/form";
import { MulticallInstance } from "../../../entities";

import "./propose-settings.ui.scss";

const _ProposeSettings = "ProposeSettings";

export interface ProposeSettingsUIProps extends HTMLProps<HTMLDivElement> {
    dao: SputnikDAO;
    diff: MulticallSettingsChange;
    editMode: boolean;
    onCancel: VoidFunction;
}

export const ProposeSettingsUI = ({
    className,
    dao,
    diff,
    disabled,
    editMode,
    onCancel,
    ...props
}: ProposeSettingsUIProps) => {
    const multicallInstance = useContext(MulticallInstance.Context);

    const schema = args.object().shape({
        description: args.string().default("").required("Proposal description is required"),
    });

    const onReset = useCallback(
        (_values: InferType<typeof schema>, { setValues }: FormikHelpers<InferType<typeof schema>>) => {
            void setValues(schema.getDefault());
            void onCancel();
        },

        [onCancel]
    );

    const onSubmit = useCallback(
        ({ description }: InferType<typeof schema>) =>
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
                {Object.values({ ...MulticallPropertyKey, ...MulticallTokenWhitelistDiffKey }).map(
                    (diffKey) =>
                        diff[diffKey].length > 0 && (
                            <div
                                className={`${_ProposeSettings}-summary-entry`}
                                key={diffKey}
                            >
                                <h3 className={`${_ProposeSettings}-summary-entry-description`}>
                                    {MulticallInstance.SettingsDiffMeta[diffKey].description + ":"}
                                </h3>

                                <ul className={`${_ProposeSettings}-summary-entry-data`}>
                                    {(Array.isArray(diff[diffKey]) ? Array.from(diff[diffKey]) : [diff[diffKey]]).map(
                                        (data) => (
                                            <li
                                                className={clsx(
                                                    `${_ProposeSettings}-summary-entry-data-chip`,

                                                    `${_ProposeSettings}-summary-entry-data-chip` +
                                                        "--" +
                                                        MulticallInstance.SettingsDiffMeta[diffKey].color
                                                )}
                                                key={data as string}
                                            >
                                                {!Number.isNaN(data) && diffKey === MulticallPropertyKey.jobBond
                                                    ? `${toNEAR(data as string)} ${NEARIcon.NATIVE_TOKEN_CHARACTER}`
                                                    : (data as string)}
                                            </li>
                                        )
                                    )}
                                </ul>
                            </div>
                        )
                )}
            </div>

            <Formik
                initialValues={schema.getDefault()}
                validationSchema={schema}
                {...{ onReset, onSubmit }}
            >
                <Form className={`${_ProposeSettings}-submit`}>
                    <div>
                        <TextField
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
            </Formik>
        </Tile>
    );
};
