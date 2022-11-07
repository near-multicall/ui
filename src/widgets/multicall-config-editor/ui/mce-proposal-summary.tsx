import clsx from "clsx";
import { FormEventHandler, HTMLAttributes } from "react";

import { ArgsString } from "../../../shared/lib/args";
import { Button, ButtonGroup, TextInput, Tile } from "../../../shared/ui/components";
import { MulticallConfigEditorConfig, MulticallConfigEditorWidget } from "../config";

import "./mce-proposal-summary.scss";

export interface MulticallConfigEditorProposalSummaryProps extends HTMLAttributes<HTMLDivElement> {
    changesDiff: MulticallConfigEditorWidget.ChangesDiff;
    classNameRoot: Required<HTMLAttributes<HTMLDivElement>>["className"];
    description: MulticallConfigEditorWidget.ProposalDescription;
    formValues: { proposalDescription: ArgsString };
    editMode: boolean;
    onCancel: FormEventHandler;
    onDescriptionUpdate: (value: string) => void;
    onSubmit: FormEventHandler;
}

export const MulticallConfigEditorProposalSummary = ({
    changesDiff,
    className,
    classNameRoot,
    description,
    formValues,
    editMode,
    onCancel,
    onDescriptionUpdate,
    onSubmit,
}: MulticallConfigEditorProposalSummaryProps) => (
    <Tile
        classes={{
            content: clsx(`${classNameRoot}-proposalSummary`, { "is-inEditMode": Boolean(editMode) }, className),
        }}
        heading={editMode ? "Changes proposal" : null}
    >
        <p className={`${classNameRoot}-proposalSummary-hint`}>
            Start editing to create config changes proposal template
        </p>

        {Object.values(MulticallConfigEditorConfig.ChangesDiffKey).map(
            (changesKey) =>
                changesDiff[changesKey].length > 0 && (
                    <div className={`${classNameRoot}-proposalSummary-changes`}>
                        <h2>{MulticallConfigEditorConfig.ChangesDiffKeyDescription[changesKey] + ":"}</h2>

                        <ul>
                            {(Array.isArray(changesDiff[changesKey])
                                ? Array.from(changesDiff[changesKey])
                                : [changesDiff[changesKey]]
                            ).map((tokenAddress) => (
                                <li>{tokenAddress}</li>
                            ))}
                        </ul>
                    </div>
                )
        )}

        <form className={`${classNameRoot}-proposalSummary-submit`}>
            <div>
                <TextInput
                    fullWidth
                    label="Description:"
                    minRows={3}
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
