import { CancelOutlined, DeleteOutlined, EditOutlined, SettingsBackupRestoreOutlined } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";

import { TextInput } from "../../../shared/ui/components";
import { ArgsString } from "../../../shared/lib/args";
import { MulticallInstance } from "../../../entities";
import { TokensWhitelistEditConfig, type TokensWhitelistEditFeature } from "../config";

interface TokensWhitelistFormProps extends TokensWhitelistEditFeature.Inputs {}

export const TokensWhitelistForm = ({
    className,
    daoContractAddress,
    disabled,
    onEdit,
    resetTrigger,
}: TokensWhitelistFormProps) => {
    const [editModeEnabled, editModeSwitch] = useState(!disabled);

    const [addTokens, markForAddition] = useState<TokensWhitelistEditFeature.FormStates["addTokens"]>(new Set()),
        [removeTokens, markForRemoval] = useState<TokensWhitelistEditFeature.FormStates["removeTokens"]>(new Set());

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
        <MulticallInstance.TokensWhitelistTable
            ItemProps={{
                idToHighlightColor: (id) =>
                    (addTokens.has(id) && TokensWhitelistEditConfig.ChangesDiffMetadata.addTokens.color) ||
                    (removeTokens.has(id) && TokensWhitelistEditConfig.ChangesDiffMetadata.removeTokens.color) ||
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
            footer={
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
            headingCorners={{
                end: editModeEnabled ? (
                    <IconButton onClick={formReset}>
                        <CancelOutlined />
                    </IconButton>
                ) : (
                    <IconButton onClick={() => void editModeSwitch(true)}>
                        <EditOutlined />
                    </IconButton>
                ),
            }}
            itemsAdditional={Array.from(addTokens)}
            {...{ className, daoContractAddress }}
        />
    );
};
