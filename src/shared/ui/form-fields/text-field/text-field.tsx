import { Autocomplete, TextField as MuiTextField, TextFieldProps as MuiTextFieldProps } from "@mui/material";
import clsx from "clsx";
import { useField } from "formik";
import "./text-field.scss";

const _TextField = "TextField";

export type TextFieldProps = Partial<MuiTextFieldProps> & {
    name: string;
    autocomplete?: string[];
    roundtop?: boolean;
    roundbottom?: boolean;
    className?: string;
};

export const TextField = ({
    name,
    autocomplete,
    roundtop,
    roundbottom,
    className,
    children,
    ...props
}: TextFieldProps) => {
    const [field, meta, helper] = useField(name);
    return (
        <div
            className={clsx(
                _TextField,
                {
                    roundtop: roundtop,
                    roundbottom: roundbottom,
                },
                className
            )}
        >
            {!!autocomplete ? (
                <Autocomplete
                    options={autocomplete}
                    freeSolo
                    fullWidth
                    inputValue={field.value}
                    onInputChange={(e, value) => {
                        helper.setValue(value);
                    }}
                    renderInput={(params) => (
                        <MuiTextField
                            {...params}
                            className={`${_TextField}-input`}
                            margin="dense"
                            size="small"
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            error={meta.touched && !!meta.error}
                            helperText={meta.touched && meta.error}
                            {...field}
                            onChange={(e) => {
                                helper.setTouched(true);
                                field.onChange(e);
                            }}
                            {...props}
                        >
                            {children}
                        </MuiTextField>
                    )}
                />
            ) : (
                <MuiTextField
                    className={`${_TextField}-input`}
                    margin="dense"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    error={meta.touched && !!meta.error}
                    helperText={meta.touched && meta.error}
                    {...field}
                    onChange={(e) => {
                        helper.setTouched(true);
                        field.onChange(e);
                    }}
                    {...props}
                >
                    {children}
                </MuiTextField>
            )}
        </div>
    );
};
