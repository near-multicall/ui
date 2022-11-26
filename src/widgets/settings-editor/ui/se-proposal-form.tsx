import clsx from "clsx";
import { FormEventHandler, HTMLProps } from "react";

import { ArgsString } from "../../../shared/lib/args-old";
import { toNEAR } from "../../../shared/lib/converter";
import { Button, ButtonGroup, NearIcon, TextInput, Tile } from "../../../shared/ui/design";
import { ModuleContext, SettingsEditor } from "../context";

import "./se-proposal-form.scss";

export interface SEProposalFormProps extends HTMLProps<HTMLDivElement> {
    changesDiff: SettingsEditor.Diff;
    classNameRoot: Required<HTMLProps<HTMLDivElement>>["className"];
    description: SettingsEditor.ProposalDescription;
    formValues: { proposalDescription: ArgsString };
    editMode: boolean;
    onCancel: FormEventHandler;
    onDescriptionUpdate: (value: string) => void;
    onSubmit: FormEventHandler;
}

export const SEProposalForm = ({
    changesDiff,
    className,
    classNameRoot,
    description,
    disabled,
    formValues,
    editMode,
    onCancel,
    onDescriptionUpdate,
    onSubmit,
}: SEProposalFormProps) => (
    <Tile
        classes={{
            content: clsx(`${classNameRoot}-proposalForm`, { "is-inEditMode": Boolean(editMode) }, className),
        }}
        heading={editMode ? "Summary" : null}
    >
        <p className={`${classNameRoot}-proposalForm-hint`}>
            {disabled
                ? "Current account has no permission to propose changes"
                : "Start editing to create config changes proposal template"}
        </p>

        <div className={`${classNameRoot}-proposalForm-summary`}>
            {Object.values(ModuleContext.DiffKey).map(
                (DiffKey) =>
                    changesDiff[DiffKey].length > 0 && (
                        <div
                            className={`${classNameRoot}-proposalForm-summary-entry`}
                            key={DiffKey}
                        >
                            <h3 className={`${classNameRoot}-proposalForm-summary-entry-description`}>
                                {ModuleContext.DiffMetadata[DiffKey].description + ":"}
                            </h3>

                            <ul className={`${classNameRoot}-proposalForm-summary-entry-data`}>
                                {(Array.isArray(changesDiff[DiffKey])
                                    ? Array.from(changesDiff[DiffKey])
                                    : [changesDiff[DiffKey]]
                                ).map((data) => (
                                    <li
                                        className={clsx(
                                            `${classNameRoot}-proposalForm-summary-entry-data-chip`,

                                            `${classNameRoot}-proposalForm-summary-entry-data-chip` +
                                                "--" +
                                                ModuleContext.DiffMetadata[DiffKey].color
                                        )}
                                        key={data as string}
                                    >
                                        {!Number.isNaN(data) && DiffKey === ModuleContext.DiffKey.jobBond
                                            ? `${toNEAR(data as string)} ${NearIcon.NATIVE_TOKEN_CHARACTER}`
                                            : (data as string)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )
            )}
        </div>

        <form className={`${classNameRoot}-proposalForm-submit`}>
            <div>
                <TextInput
                    fullWidth
                    label="Description:"
                    minRows={2}
                    multiline
                    required
                    update={(event) => void onDescriptionUpdate(event.target.value)}
                    value={formValues.proposalDescription}
                />
            </div>

            <ButtonGroup>
                <Button
                    color="error"
                    label="Cancel"
                    onClick={onCancel}
                    type="reset"
                />

                <Button
                    color="success"
                    disabled={
                        !(Object.values(changesDiff).filter(({ length }) => length > 0).length > 0) ||
                        description.length === 0
                    }
                    label="Submit"
                    onClick={onSubmit}
                    type="submit"
                />
            </ButtonGroup>
        </form>
    </Tile>
);
