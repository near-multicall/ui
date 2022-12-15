import clsx from "clsx";
import { FormEventHandler, HTMLProps, useCallback, useContext, useMemo, useState } from "react";

import { MulticallInstance } from "../../../entities";
import { ArgsString } from "../../../shared/lib/args-old";
import { Multicall, MulticallSettingsChange } from "../../../shared/lib/contracts/multicall";
import { SputnikDAO } from "../../../shared/lib/contracts/sputnik-dao";
import { toNEAR } from "../../../shared/lib/converter";
import { signAndSendTxs } from "../../../shared/lib/wallet";
import { Button, ButtonGroup, NearIcon, TextInput, Tile } from "../../../shared/ui/design";

import { ModuleContext } from "../../../widgets/settings-editor/module-context";
import "./propose-settings.scss";

const _ProposeSettings = "ProposeSettings";

export interface ProposeSettingsUIProps extends HTMLProps<HTMLDivElement> {
    dao: SputnikDAO;
    diff: MulticallSettingsChange;
    editMode: boolean;
    onCancel: VoidFunction;
}

export const ProposeSettingsUI = ({ className, dao, diff, disabled, editMode, ...props }: ProposeSettingsUIProps) => {
    const multicallInstance = useContext(MulticallInstance.Context);

    const formValues = { description: useMemo(() => new ArgsString(""), []) },
        [description, descriptionUpdate] = useState(formValues.description.value);

    const onCancel = useCallback(() => {
        void props.onCancel();
        void descriptionUpdate("");

        formValues.description.value = "";
    }, [props.onCancel, descriptionUpdate]);

    const onSubmit = useCallback<FormEventHandler>(
        (event) => {
            void event.preventDefault();

            void dao
                .proposeFunctionCall(
                    description,
                    multicallInstance.data.address,
                    Multicall.configDiffToProposalActions(diff)
                )
                .then((someTx) => signAndSendTxs([someTx]))
                .catch(console.error);
        },

        [dao, diff, description]
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
                {Object.values(ModuleContext.DiffKey).map(
                    (DiffKey) =>
                        diff[DiffKey].length > 0 && (
                            <div
                                className={`${_ProposeSettings}-summary-entry`}
                                key={DiffKey}
                            >
                                <h3 className={`${_ProposeSettings}-summary-entry-description`}>
                                    {ModuleContext.DiffMeta[DiffKey].description + ":"}
                                </h3>

                                <ul className={`${_ProposeSettings}-summary-entry-data`}>
                                    {(Array.isArray(diff[DiffKey]) ? Array.from(diff[DiffKey]) : [diff[DiffKey]]).map(
                                        (data) => (
                                            <li
                                                className={clsx(
                                                    `${_ProposeSettings}-summary-entry-data-chip`,

                                                    `${_ProposeSettings}-summary-entry-data-chip` +
                                                        "--" +
                                                        ModuleContext.DiffMeta[DiffKey].color
                                                )}
                                                key={data as string}
                                            >
                                                {!Number.isNaN(data) && DiffKey === ModuleContext.DiffKey.jobBond
                                                    ? `${toNEAR(data as string)} ${NearIcon.NATIVE_TOKEN_CHARACTER}`
                                                    : (data as string)}
                                            </li>
                                        )
                                    )}
                                </ul>
                            </div>
                        )
                )}
            </div>

            <form className={`${_ProposeSettings}-submit`}>
                <div>
                    <TextInput
                        fullWidth
                        label="Description:"
                        minRows={2}
                        multiline
                        required
                        update={(event) => void descriptionUpdate(event.target.value)}
                        value={formValues.description}
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
                            !(Object.values(diff).filter(({ length }) => length > 0).length > 0) ||
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
};
