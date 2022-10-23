import { CancelOutlined, EditOutlined } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { useEffect, useReducer, useState } from "react";

import { TextInput } from "../../../../shared/ui/components";
import { MI, MIEntity } from "../../../../entities";
import { type MITokensWhitelistEditFeature } from "../config";

interface MITokensWhitelistEditFormProps extends MITokensWhitelistEditFeature.Dependencies {}

export const MITokensWhitelistEditForm = ({
    className,
    controllerContractAddress,
    onChange,
}: MITokensWhitelistEditFormProps) => {
    const [editModeEnabled, editModeSwitch] = useState(false);

    const [toAdd, markForAddition] = useReducer(
        (previousState: MIEntity.Token["address"][], tokenAddress: MIEntity.Token["address"]) =>
            previousState.includes(tokenAddress) ? previousState : [...previousState, tokenAddress],

        []
    );

    const [toRemove, markForRemoval] = useReducer(
        (previousState: MIEntity.Token["address"][], tokenAddress: MIEntity.Token["address"]) =>
            previousState.includes(tokenAddress) ? previousState : [...previousState, tokenAddress],

        []
    );

    useEffect(() => onChange({ toAdd, toRemove }), [toAdd, toRemove, onChange]);

    return (
        <MI.TokensWhitelistTable
            additionalItems={toAdd}
            footer={editModeEnabled ? <TextInput onBlur={(event) => markForAddition(event.target.value)} /> : null}
            headingCorners={{
                right: editModeEnabled ? (
                    <IconButton onClick={() => editModeSwitch(false)}>
                        <CancelOutlined />
                    </IconButton>
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
