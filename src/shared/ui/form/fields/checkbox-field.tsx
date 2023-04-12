import { Checkbox, CheckboxProps, FormControlLabel, FormGroup } from "@mui/material";
import clsx from "clsx";
import { useField } from "formik";
import "./checkbox-field.scss";

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
                "CheckboxField",
                {
                    roundtop,
                    roundbottom,
                },
                className
            )}
        >
            <FormGroup className="CheckboxField-formGroup">
                <FormControlLabel
                    className="CheckboxField-label"
                    label={label}
                    control={
                        <Checkbox
                            className="CheckboxField-checkbox"
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
