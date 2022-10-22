import { FormLabel as GenericFormLabel, type FormLabelProps as GenericFromLabelProps } from "@mui/material";

import "./form-label.scss";

interface FormLabelProps extends Omit<GenericFromLabelProps, "classes"> {
    content: string | JSX.Element;
}

const _FormLabel = "FormLabel";

export const FormLabel = ({ content, ...props }: FormLabelProps) => (
    <GenericFormLabel
        classes={{ root: _FormLabel, focused: "is-focused" }}
        {...props}
    >
        {content}
    </GenericFormLabel>
);
