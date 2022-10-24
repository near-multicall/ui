import { EditOutlined } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { useState } from "react";

import { ArgsString } from "../../../shared/lib/args";
import { toNEAR } from "../../../shared/lib/converter";
import { NearIcons, NearLink, TextInput, Tile } from "../../../shared/ui/components";
import { type JobsSettingsEditFeature } from "../config";

interface JobsSettingsFormProps extends JobsSettingsEditFeature.Dependencies {}

export const JobsSettingsForm = ({ className, multicallContract }: JobsSettingsFormProps) => {
    const [jobsSettingsEditMode, jobsSettingsEditModeSwitch] = useState(false);

    return (
        <Tile
            classes={{ root: className }}
            heading="Jobs settings"
        >
            <h3>Croncat manager</h3>

            <IconButton
                edge="start"
                onClick={() => {
                    editModeSwitch(true);
                    jobsSettingsEditModeSwitch(true);
                }}
            >
                <EditOutlined />
            </IconButton>

            {editMode && jobsSettingsEditMode ? (
                <TextInput
                    onBlur={(event) => changesDiffUpdate({ croncatManager: event.target.value })}
                    value={new ArgsString(multicallContract.croncatManager)}
                    fullWidth
                />
            ) : (
                <NearLink address={multicallContract.croncatManager} />
            )}

            <h3>Job bond</h3>

            <span>
                {!editMode &&
                    `${multicallContract.jobBond !== "" ? toNEAR(multicallContract.jobBond) : "..."} ${
                        NearIcons.NATIVE_TOKEN_CHARACTER
                    }`}

                {editMode && (
                    <TextInput
                        InputProps={{ endAdornment: NearIcons.NATIVE_TOKEN_CHARACTER }}
                        update={(event) => changesDiffUpdate({ jobBond: event.target.value })}
                        type="number"
                        value={
                            new ArgsString(multicallContract.jobBond !== "" ? toNEAR(multicallContract.jobBond) : "")
                        }
                    />
                )}
            </span>
        </Tile>
    );
};
