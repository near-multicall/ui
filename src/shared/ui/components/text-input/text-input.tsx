import { ChangeEvent, Component } from "react";
import { MenuItem, TextField, TextFieldProps } from "@mui/material";

import { ArgsError, ArgsString } from "../../../lib/args";

export interface TextInputProps extends Omit<TextFieldProps, "error" | "size" | "value" | "variant"> {
    error?: ArgsError;
    update?: (event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>, component?: Component) => void;
    value?: ArgsString;
}

export class TextInput extends Component<TextInputProps> {
    render() {
        const { label, value, error, update, ...props } = this.props;

        const errors = Array.isArray(error) ? error : [error];

        return (
            <TextField
                value={value?.value}
                margin="dense"
                size="small"
                onChange={(event) => {
                    if (value) {
                        value.value = event.target.value;
                        errors.forEach((error) => error?.validOrNull(value));
                        update?.(event, this);
                        this.forceUpdate();
                    }
                }}
                error={errors.some((error) => error?.isBad)}
                helperText={errors.find((error) => error?.isBad)?.message}
                InputLabelProps={{ shrink: true }}
                {...{ ...props, label }}
            />
        );
    }
}

export interface TextInputWithUnitsProps extends TextInputProps {
    value: ArgsString;
    // TODO!: Extend the interface
}

export class TextInputWithUnits extends Component<TextInputWithUnitsProps> {
    render() {
        const { label, value, error, options, update, textProps, unitProps, ...props } = this.props;

        const errors = Array.isArray(error) ? error : [error]; // works with undefined too

        return (
            <div className="unitInput">
                <TextField
                    label={label}
                    value={
                        errors.map((e) => {
                            if (e !== undefined) return e.validOrNull(value) || e.intermediate;
                        })[0] ?? value
                    }
                    margin="dense"
                    size="small"
                    onChange={(e) => {
                        value.value = e.target.value;
                        errors.forEach((e) => e?.validOrNull(value));
                        update?.(e, this);
                    }}
                    error={errors.some((e) => e?.isBad)}
                    helperText={errors.find((error) => error?.isBad)?.message}
                    InputLabelProps={{ shrink: true }}
                    {...textProps}
                    {...props}
                />
                <TextField
                    label="Unit"
                    value={value.unit}
                    margin="dense"
                    size="small"
                    select
                    onChange={(e) => {
                        value.unit = e.target.value;
                        errors.forEach((e) => e?.validOrNull(value));
                        update?.(e, this);
                        this.forceUpdate();
                    }}
                    InputLabelProps={{ shrink: true }}
                    {...unitProps}
                    {...props}
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
    }
}
