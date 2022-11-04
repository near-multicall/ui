import clsx from "clsx";
import { FormEventHandler, HTMLAttributes } from "react";

import { ArgsString } from "../../../shared/lib/args";
import { Button, ButtonGroup, TextInput, Tile } from "../../../shared/ui/components";
import { MulticallConfigEditorWidget } from "../config";

export interface MulticallConfigEditorProposalSubmitProps extends HTMLAttributes<HTMLDivElement> {
    changesDiff: MulticallConfigEditorWidget.ChangesDiff;
    description: MulticallConfigEditorWidget.ProposalDescription;
    formValues: { proposalDescription: ArgsString };
    editMode: boolean;
    onCancel: FormEventHandler;
    onDescriptionUpdate: (value: string) => void;
    onSubmit: FormEventHandler;
}

export const MulticallConfigEditorProposalSubmit = ({
    changesDiff,
    className,
    description,
    formValues,
    editMode,
    onCancel,
    onDescriptionUpdate,
    onSubmit,
}: MulticallConfigEditorProposalSubmitProps) => (
    <Tile
        classes={{
            content: clsx({ "is-inEditMode": Boolean(editMode) }, className),
        }}
        heading={editMode ? "Changes proposal" : null}
    >
        <p>Start editing to create config changes proposal template</p>

        <form>
            <div>{JSON.stringify(changesDiff)}</div>

            <div>
                <TextInput
                    fullWidth
                    label="Description"
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
