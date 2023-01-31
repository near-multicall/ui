import clsx from "clsx";
import { TextField, TextFieldProps } from "./text-field";
import { SelectField, SelectFieldProps } from "./select-field";
import "./unit-field.scss";

type UnitFieldProps = {
    textProps?: Omit<TextFieldProps, "name">;
    unitProps?: Omit<SelectFieldProps, "name">;
    name: string;
    unit: string;
    label: string;
    options: string[];
    roundtop?: boolean;
    roundbottom?: boolean;
};

export const UnitField = ({ name, unit, label, options, roundtop, roundbottom, ...props }: UnitFieldProps) => {
    return (
        <div
            className={clsx("UnitField", {
                roundtop,
                roundbottom,
            })}
        >
            <TextField
                name={name}
                label={label}
                {...props?.textProps}
                className={clsx("UnitField-text", props?.textProps?.className)}
            />
            <SelectField
                name={unit}
                hiddenLabel={true}
                options={options}
                {...props?.unitProps}
                className={clsx("UnitField-unit", props?.unitProps?.className)}
            />
        </div>
    );
};
