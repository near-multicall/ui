import { FormControlLabel, Radio } from "@mui/material";
import clsx from "clsx";
import { ComponentProps } from "react";

import "./form-field-radio.scss";

export interface FormFieldRadioProps extends Omit<ComponentProps<typeof FormControlLabel>, "control"> {}

const _FormFieldRadio = "FormFieldRadio";

export const FormFieldRadio = ({ className, ...props }: FormFieldRadioProps) => (
    <FormControlLabel
        classes={{ root: clsx(_FormFieldRadio, className), label: `${_FormFieldRadio}-label` }}
        control={<Radio classes={{ root: `${_FormFieldRadio}-button` }} />}
        {...props}
    />
);
