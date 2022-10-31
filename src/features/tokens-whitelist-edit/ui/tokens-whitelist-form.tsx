import { CancelOutlined, DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";

import { TextInput } from "../../../shared/ui/components";
import { Fn } from "../../../shared/lib/fn";
import { ArgsString } from "../../../shared/lib/args";
import { MulticallInstance } from "../../../entities";
import { type TokensWhitelistEditFeature } from "../config";

interface TokensWhitelistFormProps extends TokensWhitelistEditFeature.Dependencies {}

export const TokensWhitelistForm = ({ className, daoContractAddress, disabled, onEdit }: TokensWhitelistFormProps) => {
    const [editModeEnabled, editModeSwitch] = useState(!disabled);

    const [addTokens, markForAddition] = useState<TokensWhitelistEditFeature.FormStates["addTokens"]>(new Set()),
        [removeTokens, markForRemoval] = useState<TokensWhitelistEditFeature.FormStates["removeTokens"]>(new Set());

    const tokenToAddAddress = useMemo(() => new ArgsString(""), []);

    const onAdditionRequest = useCallback(
        (input: string) => {
            if (removeTokens.has(input)) {
                markForRemoval(
                    (markedForRemoval) => new Set(Array.from(markedForRemoval).filter((address) => address !== input))
                );
            } else {
                markForAddition((markedForAddition) =>
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
                markForAddition(
                    (markedForAddition) => new Set(Array.from(markedForAddition).filter((address) => address !== input))
                );
            } else {
                markForRemoval((markedForRemoval) => new Set(markedForRemoval.add(input)));
            }
        },
        [addTokens, editModeSwitch, markForAddition, markForRemoval]
    );

    const formReset = useCallback(() => {
        markForAddition(new Set());
        markForRemoval(new Set());
        editModeSwitch(false);
    }, [editModeSwitch, markForAddition, markForRemoval]);

    useEffect(disabled ? formReset : Fn.returnVoid, [disabled, formReset]);

    useEffect(
        () => onEdit({ addTokens: Array.from(addTokens), removeTokens: Array.from(removeTokens) }),
        [addTokens, removeTokens, onEdit]
    );

    return (
        <MulticallInstance.TokensWhitelistTable
            ItemProps={{
                slots: {
                    End: editModeEnabled
                        ? ({ rowId }) => (
                              <IconButton onClick={() => onRemovalRequest(rowId)}>
                                  <DeleteOutlined fontSize="large" />
                              </IconButton>
                          )
                        : void null,
                },
            }}
            additionalItems={Array.from(addTokens)}
            footer={
                editModeEnabled ? (
                    <TextInput
                        fullWidth
                        label="New token address"
                        onKeyUp={({ key, target }) =>
                            key === "Enter" && Object.hasOwn(target, "value")
                                ? onAdditionRequest((target as HTMLInputElement).value)
                                : void null
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
                    <IconButton onClick={() => editModeSwitch(true)}>
                        <EditOutlined />
                    </IconButton>
                ),
            }}
            {...{ className, daoContractAddress }}
        />
    );
};
