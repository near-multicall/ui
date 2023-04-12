import clsx from "clsx";
import { useField } from "formik";
import { TextField as MuiTextField, TextFieldProps as MuiTextFieldProps } from "@mui/material";
import "./file-field.scss";

type FileFieldProps = MuiTextFieldProps & {
    name: string;
    roundtop?: boolean;
    roundbottom?: boolean;
    accept: React.HTMLProps<HTMLInputElement>["accept"];
    className?: string;
    onChangeHandler?: (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => any;
};

export const FileField = ({
    roundbottom,
    roundtop,
    name,
    className,
    accept,
    onChangeHandler,
    ...props
}: FileFieldProps) => {
    const [field, meta, helper] = useField<File | null>(name);
    return (
        <div
            className={clsx(
                "FileField",
                {
                    roundtop,
                    roundbottom,
                },
                className
            )}
        >
            <MuiTextField
                type="file"
                className="FileField-input"
                margin="dense"
                size="small"
                InputLabelProps={{ shrink: true }}
                fullWidth
                error={meta.touched && !!meta.error}
                helperText={meta.touched && meta.error}
                inputProps={{
                    type: "file",
                    accept,
                    onChange: (e) => {
                        helper.setValue((e.currentTarget as HTMLInputElement).files?.[0] ?? null);
                        onChangeHandler?.(e);
                    },
                }}
                {...props}
            />
        </div>
    );
};
