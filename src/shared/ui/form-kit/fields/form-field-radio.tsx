import { FormControlLabel, Radio } from "@mui/material";
import clsx from "clsx";
import { ComponentProps } from "react";

import "./form-field-radio.scss";

export interface FormFieldRadioProps extends Omit<ComponentProps<typeof FormControlLabel>, "control"> {}

const _FormFieldRadio = "FormFieldRadio";

export const FormFieldRadio = ({ className, label, value }: FormFieldRadioProps) => (
    <FormControlLabel
        className={clsx(_FormFieldRadio, className)}
        control={<Radio />}
        {...{ label, value }}
    />
);
