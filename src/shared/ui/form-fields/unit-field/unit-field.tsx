import clsx from "clsx";
import { TextField, TextFieldProps } from "../text-field/text-field";
import { SelectField, SelectFieldProps } from "../select-field/select-field";
import "./unit-field.scss";

const _UnitField = "UnitField";

type UnitFieldProps = {
    textProps?: Omit<TextFieldProps, "name">;
    unitProps?: Omit<SelectFieldProps, "name">;
    name: string;
    unit: string;
    label: string;
    options: string[];
    roundTop?: boolean;
    roundBottom?: boolean;
};

export const UnitField = ({ name, unit, label, options, ...props }: UnitFieldProps) => {
    console.log(
        clsx(_UnitField, {
            roundTop: props?.roundTop,
            roundBottom: props?.roundBottom,
        })
    );
    return (
        <div
            className={clsx(_UnitField, {
                roundTop: props?.roundTop,
                roundBottom: props?.roundBottom,
            })}
        >
            <TextField
                name={name}
                label={label}
                {...props?.textProps}
                className={clsx(`${_UnitField}-text`, props?.textProps?.className)}
            />
            <SelectField
                name={unit}
                hiddenLabel={true}
                options={options}
                {...props?.unitProps}
                className={clsx(`${_UnitField}-unit`, props?.unitProps?.className)}
            />
        </div>
    );
};
