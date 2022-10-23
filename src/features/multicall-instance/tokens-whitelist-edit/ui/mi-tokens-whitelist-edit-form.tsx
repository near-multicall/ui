import { CancelOutlined, DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { useCallback, useEffect, useReducer, useState } from "react";

import { TextInput } from "../../../../shared/ui/components";
import { MI, MIEntity } from "../../../../entities";
import { type MITokensWhitelistEditFeature } from "../config";
import { Fn } from "../../../../shared/lib/fn";

interface MITokensWhitelistEditFormProps extends MITokensWhitelistEditFeature.Dependencies {}

export const MITokensWhitelistEditForm = ({
    className,
    controllerContractAddress,
    disabled,
    onEdit,
}: MITokensWhitelistEditFormProps) => {
    const [editModeEnabled, editModeSwitch] = useState(!disabled);

    const [addTokens, markForAddition] = useReducer(
        (previousState: MIEntity.ConfigChanges["addTokens"], address: string | null) =>
            address === null
                ? []
                : previousState.includes(address) || address.length < 1
                ? previousState
                : [...previousState, address],

        []
    );

    const [removeTokens, markForRemoval] = useReducer(
        (previousState: MIEntity.ConfigChanges["removeTokens"], address: string | null) =>
            address === null ? [] : previousState.includes(address) ? previousState : [...previousState, address],

        []
    );

    const formReset = useCallback(() => {
        editModeSwitch(false);
        markForAddition(null);
        markForRemoval(null);
    }, []);

    useEffect(disabled ? formReset : Fn.returnVoid, [disabled, formReset]);

    useEffect(() => onEdit({ addTokens, removeTokens }), [addTokens, removeTokens, onEdit]);

    return (
        <MI.TokensWhitelistTable
            additionalItems={addTokens}
            footer={editModeEnabled ? <TextInput onBlur={(event) => markForAddition(event.target.value)} /> : null}
            headingCorners={{
                right: editModeEnabled ? (
                    <>
                        <IconButton onClick={() => editModeSwitch(false)}>
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
            {...{ className, controllerContractAddress }}
        />
    );
};
