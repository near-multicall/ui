import clsx from "clsx";
import { FormEventHandler, HTMLProps } from "react";

import { ArgsString } from "../../../shared/lib/args-old";
import { toNEAR } from "../../../shared/lib/converter";
import { Button, ButtonGroup, NearIcon, TextInput, Tile } from "../../../shared/ui/design";
import { MulticallConfigEditorConfig, MulticallConfigEditorWidget } from "../config";

import "./mce-changes-proposal.scss";

export interface MCEChangesProposalProps extends HTMLProps<HTMLDivElement> {
    changesDiff: MulticallConfigEditorWidget.ChangesDiff;
    classNameRoot: Required<HTMLProps<HTMLDivElement>>["className"];
    description: MulticallConfigEditorWidget.ProposalDescription;
    formValues: { proposalDescription: ArgsString };
    editMode: boolean;
    onCancel: FormEventHandler;
    onDescriptionUpdate: (value: string) => void;
    onSubmit: FormEventHandler;
}

export const MCEChangesProposal = ({
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
}: MCEChangesProposalProps) => (
    <Tile
        classes={{
            content: clsx(`${classNameRoot}-changesProposal`, { "is-inEditMode": Boolean(editMode) }, className),
        }}
        heading={editMode ? "Summary" : null}
    >
        <p className={`${classNameRoot}-changesProposal-hint`}>
            {disabled
                ? "Current account has no permission to propose changes"
                : "Start editing to create config changes proposal template"}
        </p>

        <div className={`${classNameRoot}-changesProposal-summary`}>
            {Object.values(MulticallConfigEditorConfig.ChangesDiffKey).map(
                (ChangesDiffKey) =>
                    changesDiff[ChangesDiffKey].length > 0 && (
                        <div
                            className={`${classNameRoot}-changesProposal-summary-entry`}
                            key={ChangesDiffKey}
                        >
                            <h3 className={`${classNameRoot}-changesProposal-summary-entry-description`}>
                                {MulticallConfigEditorConfig.ChangesDiffMetadata[ChangesDiffKey].description + ":"}
                            </h3>

                            <ul className={`${classNameRoot}-changesProposal-summary-entry-data`}>
                                {(Array.isArray(changesDiff[ChangesDiffKey])
                                    ? Array.from(changesDiff[ChangesDiffKey])
                                    : [changesDiff[ChangesDiffKey]]
                                ).map((data) => (
                                    <li
                                        className={clsx(
                                            `${classNameRoot}-changesProposal-summary-entry-data-chip`,

                                            `${classNameRoot}-changesProposal-summary-entry-data-chip` +
                                                "--" +
                                                MulticallConfigEditorConfig.ChangesDiffMetadata[ChangesDiffKey].color
                                        )}
                                        key={data as string}
                                    >
                                        {!Number.isNaN(data) &&
                                        ChangesDiffKey === MulticallConfigEditorConfig.ChangesDiffKey.jobBond
                                            ? `${toNEAR(data as string)} ${NearIcon.NATIVE_TOKEN_CHARACTER}`
                                            : (data as string)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )
            )}
        </div>

        <form className={`${classNameRoot}-changesProposal-submit`}>
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
