import { FormControlLabel, Radio } from "@mui/material";
import clsx from "clsx";
import { ComponentProps } from "react";

import "./radio-button.scss";

interface RadioButtonProps extends Omit<ComponentProps<typeof FormControlLabel>, "control"> {}

const _RadioButton = "RadioButton";

export const RadioButton = ({ className, label, value }: RadioButtonProps) => (
    <FormControlLabel
        className={clsx(_RadioButton, className)}
        control={<Radio />}
        {...{ label, value }}
    />
);
