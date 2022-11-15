import { MenuItem } from "@mui/material";
import clsx from "clsx";
import { TextField, TextFieldProps } from "./text-field";

const _SelectField = "SelectField";

export type SelectFieldProps = TextFieldProps & {
    options: string[];
};

export const SelectField = ({ options, ...props }: SelectFieldProps) => {
    return (
        <div className={_SelectField}>
            <TextField
                {...props}
                select
                className={clsx(`${_SelectField}-input`, props?.className)}
            >
                {options.map((o) => (
                    <MenuItem
                        key={o}
                        value={o}
                    >
                        {o}
                    </MenuItem>
                ))}
            </TextField>
        </div>
    );
};
