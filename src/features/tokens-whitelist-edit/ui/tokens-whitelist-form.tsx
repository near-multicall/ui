import { CancelOutlined, DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { useCallback, useEffect, useState } from "react";

import { TextInput } from "../../../shared/ui/components";
import { Fn } from "../../../shared/lib/fn";
import { ArgsString } from "../../../shared/lib/args";
import { MulticallInstance } from "../../../entities";
import { type TokensWhitelistEditFeature } from "../config";

interface TokensWhitelistFormProps extends TokensWhitelistEditFeature.Dependencies {}

export const TokensWhitelistForm = ({
    className,
    controllerContractAddress,
    disabled,
    onEdit,
}: TokensWhitelistFormProps) => {
    const [editModeEnabled, editModeSwitch] = useState(!disabled);

    const [addTokens, markForAddition] = useState<TokensWhitelistEditFeature.FormState["addTokens"]>([]),
        [removeTokens, markForRemoval] = useState<TokensWhitelistEditFeature.FormState["removeTokens"]>([]);

    const tokenToAddAddress = new ArgsString("");

    const onAdditionRequest = useCallback(
        (input: string) => {
            if (removeTokens.includes(input)) {
                markForRemoval((markedForRemoval) => markedForRemoval.filter((address) => address !== input));
            } else {
                markForAddition((markedForAddition) =>
                    markedForAddition.concat(
                        [input].filter((address) => !markedForAddition.includes(address) && address.length > 0)
                    )
                );
            }

            tokenToAddAddress.value = "";
        },

        [markForAddition, markForRemoval, removeTokens]
    );

    const [selected, onSelected] = useState<string[]>([]);

    const onRemovalRequest = useCallback(() => {
        if (selected.some((address) => addTokens.includes(address))) {
            markForAddition((markedForAddition) => markedForAddition.filter((address) => !selected.includes(address)));
        }

        markForRemoval((markedForRemoval) =>
            markedForRemoval.concat(
                selected.filter((address) => !markedForRemoval.includes(address) && !addTokens.includes(address))
            )
        );

        editModeSwitch(false);
    }, [addTokens, editModeSwitch, markForAddition, markForRemoval, selected]);

    const formReset = useCallback(() => {
        markForAddition([]);
        markForRemoval([]);
        editModeSwitch(false);
    }, [editModeSwitch, markForAddition, markForRemoval]);

    useEffect(disabled ? formReset : Fn.returnVoid, [disabled, formReset]);

    useEffect(() => onEdit({ addTokens, removeTokens }), [addTokens, removeTokens, onEdit]);

    return (
        <MulticallInstance.TokensWhitelistTable
            additionalItems={addTokens}
            footer={
                editModeEnabled ? (
                    <TextInput
                        fullWidth
                        label="New token address"
                        onBlur={(event) => onAdditionRequest(event.target.value)}
                        value={tokenToAddAddress}
                    />
                ) : null
            }
            headingCorners={{
                right: editModeEnabled ? (
                    <>
                        {selected.length > 0 && (
                            <IconButton onClick={onRemovalRequest}>
                                <DeleteOutlined />
                            </IconButton>
                        )}

                        <IconButton onClick={formReset}>
                            <CancelOutlined />
                        </IconButton>
                    </>
                ) : (
                    <IconButton onClick={() => editModeSwitch(true)}>
                        <EditOutlined />
                    </IconButton>
                ),
            }}
            onItemsSelected={editModeEnabled ? onSelected : null}
            {...{ className, controllerContractAddress }}
        />
    );
};
