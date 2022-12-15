import { CancelOutlined, DeleteOutlined, EditOutlined, SettingsBackupRestoreOutlined } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { HTMLProps, useCallback, useEffect, useMemo, useState } from "react";

import { MulticallSettingsChange, MulticallTokenWhitelistDiffKey } from "../../shared/lib/contracts/multicall";
import { TextInput, Tooltip } from "../../shared/ui/design";
import { ArgsString } from "../../shared/lib/args-old";
import { MulticallInstance } from "../../entities";
import { ModuleContext } from "./module-context";

import "./ui.scss";

const _ManageTokenWhitelist = "ManageTokenWhitelist";

type FormState = Pick<MulticallSettingsChange, MulticallTokenWhitelistDiffKey>;

interface ManageTokenWhitelistUIProps extends Omit<HTMLProps<HTMLDivElement>, "onChange"> {
    onEdit: (payload: FormState) => void;
    resetTrigger: { subscribe: (callback: EventListener) => () => void };
}

interface FormStates extends Record<keyof FormState, Set<MulticallSettingsChange[keyof FormState][number]>> {}

export const ManageTokenWhitelistUI = ({ disabled, onEdit, resetTrigger }: ManageTokenWhitelistUIProps) => {
    const [editModeEnabled, editModeSwitch] = useState(false);

    const [addTokens, markForAddition] = useState<FormStates["addTokens"]>(new Set()),
        [removeTokens, markForRemoval] = useState<FormStates["removeTokens"]>(new Set());

    const tokenToAddAddress = useMemo(() => new ArgsString(""), []);

    const onAdditionRequest = useCallback(
        (input: string) => {
            if (removeTokens.has(input)) {
                void markForRemoval(
                    (markedForRemoval) => new Set(Array.from(markedForRemoval).filter((address) => address !== input))
                );
            } else {
                void markForAddition((markedForAddition) =>
                    input.length > 0 ? new Set(markedForAddition.add(input)) : markedForAddition
                );
            }

            tokenToAddAddress.value = "";
        },

        [markForAddition, markForRemoval, removeTokens]
    );

    const onRemovalRequest = useCallback(
        (input: string) => {
            if (addTokens.has(input)) {
                void markForAddition(
                    (markedForAddition) => new Set(Array.from(markedForAddition).filter((address) => address !== input))
                );
            } else {
                void markForRemoval((markedForRemoval) => new Set(markedForRemoval.add(input)));
            }
        },
        [addTokens, editModeSwitch, markForAddition, markForRemoval]
    );

    const formReset = useCallback(() => {
        void markForAddition(new Set());
        void markForRemoval(new Set());
        void editModeSwitch(false);
    }, [editModeSwitch, markForAddition, markForRemoval]);

    useEffect(() => resetTrigger.subscribe(formReset), [formReset, resetTrigger]);

    useEffect(
        () => void onEdit({ addTokens: Array.from(addTokens), removeTokens: Array.from(removeTokens) }),
        [addTokens, removeTokens, onEdit]
    );

    return (
        <MulticallInstance.TokenWhitelistTable
            ItemProps={{
                idToHighlightColor: (id) =>
                    (addTokens.has(id) && ModuleContext.DiffMeta.addTokens.color) ||
                    (removeTokens.has(id) && ModuleContext.DiffMeta.removeTokens.color) ||
                    null,

                slots: {
                    End:
                        (editModeEnabled &&
                            (({ rowId }) =>
                                removeTokens.has(rowId) ? (
                                    <IconButton onClick={() => void onAdditionRequest(rowId)}>
                                        <SettingsBackupRestoreOutlined fontSize="large" />
                                    </IconButton>
                                ) : (
                                    <IconButton onClick={() => void onRemovalRequest(rowId)}>
                                        <DeleteOutlined fontSize="large" />
                                    </IconButton>
                                ))) ||
                        void null,
                },
            }}
            className={_ManageTokenWhitelist}
            headerSlots={{
                end: editModeEnabled ? (
                    <Tooltip content="Cancel & Reset">
                        <IconButton onClick={formReset}>
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
            itemsAdditional={Array.from(addTokens)}
            subheader={
                editModeEnabled ? (
                    <TextInput
                        fullWidth
                        label="New token address"
                        onKeyUp={({ key, target }) =>
                            void (key === "Enter" && Object.hasOwn(target, "value")
                                ? onAdditionRequest((target as HTMLInputElement).value)
                                : null)
                        }
                        value={tokenToAddAddress}
                    />
                ) : (
                    void null
                )
            }
        />
    );
};
