import { Checkbox, CheckboxProps, FormControlLabel, FormGroup } from "@mui/material";
import clsx from "clsx";
import { useField } from "formik";
import "./checkbox-field.scss";

const _CheckboxField = "CheckboxField";

export type CheckboxFieldProps = Partial<CheckboxProps> & {
    name: string;
    label: string;
    roundtop?: boolean;
    roundbottom?: boolean;
    className?: string;
};

export const CheckboxField = ({ name, label, roundtop, roundbottom, className, ...props }: CheckboxFieldProps) => {
    const [field] = useField(name);
    return (
        <div
            className={clsx(
                _CheckboxField,
                {
                    roundtop: roundtop,
                    roundbottom: roundbottom,
                },
                className
            )}
        >
            <FormGroup className={`${_CheckboxField}-formGroup`}>
                <FormControlLabel
                    className={`${_CheckboxField}-label`}
                    label={label}
                    control={
                        <Checkbox
                            className={`${_CheckboxField}-checkbox`}
                            size="medium"
                            {...field}
                            {...props}
                        />
                    }
                />
            </FormGroup>
        </div>
    );
};
