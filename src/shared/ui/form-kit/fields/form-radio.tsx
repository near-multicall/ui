import { FormControlLabel, Radio } from "@mui/material";
import clsx from "clsx";
import { ComponentProps } from "react";

import "./form-radio.scss";

export interface FormRadioProps extends Omit<ComponentProps<typeof FormControlLabel>, "control"> {}

const _FormRadio = "FormRadio";

export const FormRadio = ({ className, ...props }: FormRadioProps) => (
    <FormControlLabel
        classes={{ root: clsx(_FormRadio, className), label: `${_FormRadio}-label` }}
        control={<Radio classes={{ root: `${_FormRadio}-button` }} />}
        {...props}
    />
);
