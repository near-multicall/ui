import { FormControlLabel, Radio } from "@mui/material";
import clsx from "clsx";
import { ComponentProps } from "react";

import "./form-radio.scss";

export interface FormRadioProps extends Omit<ComponentProps<typeof FormControlLabel>, "control"> {}

export const FormRadio = ({ className, ...props }: FormRadioProps) => (
    <FormControlLabel
        classes={{ root: clsx("FormRadio", className), label: "FormRadio-label" }}
        control={<Radio classes={{ root: "FormRadio-button" }} />}
        {...props}
    />
);
