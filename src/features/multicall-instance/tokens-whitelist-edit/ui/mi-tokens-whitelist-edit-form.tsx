import { CancelOutlined, DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { useCallback, useEffect, useReducer, useState } from "react";

import { TextInput } from "../../../../shared/ui/components";
import { Fn } from "../../../../shared/lib/fn";
import { ArgsString } from "../../../../shared/lib/args";
import { MI, MIEntity } from "../../../../entities";
import { type MITokensWhitelistEditFeature } from "../config";

interface MITokensWhitelistEditFormProps extends MITokensWhitelistEditFeature.Dependencies {}

export const MITokensWhitelistEditForm = ({
    className,
    controllerContractAddress,
    disabled,
    onEdit,
}: MITokensWhitelistEditFormProps) => {
    const [editModeEnabled, editModeSwitch] = useState(!disabled);

    const [addTokens, markForAddition] = useState<MIEntity.ConfigChanges["addTokens"]>([]);

    const [removeTokens, markForRemoval] = useState<MIEntity.ConfigChanges["removeTokens"]>([]);

    const tokenToAddAddress = new ArgsString("");

    const onAdditionRequest = useCallback(
        (input: string) => {
            if (removeTokens.includes(input)) {
                markForRemoval((markedForRemoval) => markedForRemoval.filter((address) => address !== input));
            } else {
                markForAddition((markedForAddition) =>
                    markedForAddition.concat(
                        [input].filter((address) => !markedForAddition.includes(address) || address.length > 0)
                    )
                );
            }

            tokenToAddAddress.value = "";
        },

        [markForAddition]
    );

    const [selected, onSelect] = useState<string[]>([]);

    const onRemovalRequest = useCallback(() => {
        if (selected.some(addTokens.includes)) {
            markForAddition((markedForAddition) => markedForAddition.filter((address) => !selected.includes(address)));
        }

        markForRemoval((markedForRemoval) =>
            markedForRemoval.concat(
                selected.filter((address) => !markedForRemoval.includes(address) || !addTokens.includes(address))
            )
        );

        editModeSwitch(false);
    }, [editModeSwitch, markForRemoval, selected]);

    const formReset = useCallback(() => {
        markForAddition([]);
        markForRemoval([]);
        editModeSwitch(false);
    }, [editModeSwitch, markForAddition, markForRemoval]);

    useEffect(disabled ? formReset : Fn.returnVoid, [disabled, formReset]);

    useEffect(() => onEdit({ addTokens, removeTokens }), [addTokens, removeTokens, onEdit]);

    return (
        <MI.TokensWhitelistTable
            additionalItems={addTokens}
            footer={
                editModeEnabled ? (
                    <TextInput
                        onBlur={(event) => onAdditionRequest(event.target.value)}
                        value={tokenToAddAddress}
                    />
                ) : null
            }
            headingCorners={{
                right: editModeEnabled ? (
                    <>
                        <IconButton onClick={onRemovalRequest}>
                            <DeleteOutlined />
                        </IconButton>

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
            onItemsSelected={onSelect}
            {...{ className, controllerContractAddress }}
        />
    );
};
