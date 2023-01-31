import { MenuItem } from "@mui/material";
import clsx from "clsx";
import { TextField, TextFieldProps } from "./text-field";

export type SelectFieldProps = TextFieldProps & {
    options: string[];
};

export const SelectField = ({ options, ...props }: SelectFieldProps) => {
    return (
        <div className="SelectField">
            <TextField
                {...props}
                select
                className={clsx("SelectField-input", props?.className)}
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
