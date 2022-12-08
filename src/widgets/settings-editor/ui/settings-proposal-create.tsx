import clsx from "clsx";
import { FormEventHandler, HTMLProps } from "react";

import { ArgsString } from "../../../shared/lib/args-old";
import { toNEAR } from "../../../shared/lib/converter";
import { Button, ButtonGroup, NearIcon, TextInput, Tile } from "../../../shared/ui/design";
import { ModuleContext, SettingsEditor } from "../module-context";

import "./settings-proposal-create.scss";

export interface SettingsProposalCreateProps extends HTMLProps<HTMLDivElement> {
    changesDiff: SettingsEditor.Diff;
    description: SettingsEditor.ProposalDescription;
    formValues: { proposalDescription: ArgsString };
    editMode: boolean;
    onCancel: FormEventHandler;
    onDescriptionUpdate: (value: string) => void;
    onSubmit: FormEventHandler;
}

const _SettingsProposalCreate = "SettingsProposalCreate";

export const SettingsProposalCreate = ({
    changesDiff,
    className,
    description,
    disabled,
    formValues,
    editMode,
    onCancel,
    onDescriptionUpdate,
    onSubmit,
}: SettingsProposalCreateProps) => (
    <Tile
        classes={{
            content: clsx(_SettingsProposalCreate, { "is-inEditMode": Boolean(editMode) }, className),
        }}
        heading={editMode ? "Summary" : null}
    >
        <p className={`${_SettingsProposalCreate}-hint`}>
            {disabled
                ? "Current account has no permission to propose changes"
                : "Start editing to create config changes proposal template"}
        </p>

        <div className={`${_SettingsProposalCreate}-summary`}>
            {Object.values(ModuleContext.DiffKey).map(
                (DiffKey) =>
                    changesDiff[DiffKey].length > 0 && (
                        <div
                            className={`${_SettingsProposalCreate}-summary-entry`}
                            key={DiffKey}
                        >
                            <h3 className={`${_SettingsProposalCreate}-summary-entry-description`}>
                                {ModuleContext.DiffMeta[DiffKey].description + ":"}
                            </h3>

                            <ul className={`${_SettingsProposalCreate}-summary-entry-data`}>
                                {(Array.isArray(changesDiff[DiffKey])
                                    ? Array.from(changesDiff[DiffKey])
                                    : [changesDiff[DiffKey]]
                                ).map((data) => (
                                    <li
                                        className={clsx(
                                            `${_SettingsProposalCreate}-summary-entry-data-chip`,

                                            `${_SettingsProposalCreate}-summary-entry-data-chip` +
                                                "--" +
                                                ModuleContext.DiffMeta[DiffKey].color
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

        <form className={`${_SettingsProposalCreate}-submit`}>
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
