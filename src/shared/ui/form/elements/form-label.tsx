import { FormLabel as GenericFormLabel, type FormLabelProps as GenericFromLabelProps } from "@mui/material";

import "./form-label.scss";

type FormLabelProps = Omit<GenericFromLabelProps, "classes">;

const _FormLabel = "FormLabel";

export const FormLabel = ({ content, ...props }: FormLabelProps) => (
    <GenericFormLabel
        classes={{ root: _FormLabel, focused: "is-focused" }}
        {...props}
    >
        {content}
    </GenericFormLabel>
);
