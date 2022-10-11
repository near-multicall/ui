import { TextField as MuiTextField, TextFieldProps as MuiTextFieldProps } from "@mui/material";
import clsx from "clsx";
import { useField } from "formik";
import "./text-field.scss";

const _TextField = "TextField";

export type TextFieldProps = Partial<MuiTextFieldProps> & {
    name: string;
    roundTop?: boolean;
    roundBottom?: boolean;
    className: string;
};

export const TextField = ({ name, className, children, ...props }: TextFieldProps) => {
    const [field, meta] = useField(name);
    return (
        <div
            className={clsx(
                _TextField,
                {
                    roundTop: props?.roundTop,
                    roundBottom: props?.roundBottom,
                },
                className
            )}
        >
            <MuiTextField
                className={`${_TextField}-input`}
                margin="dense"
                size="small"
                InputLabelProps={{ shrink: true }}
                fullWidth
                error={meta.touched && !!meta.error}
                helperText={meta.touched && meta.error}
                {...field}
                {...props}
            >
                {children}
            </MuiTextField>
        </div>
    );
};
