import { FormLabel as GenericFormLabel, type FormLabelProps as GenericFromLabelProps } from "@mui/material";

import "./form-label.scss";

interface FormLabelProps extends Omit<GenericFromLabelProps, "classes"> {
    content: string | JSX.Element;
}

export const FormLabel = ({ content, ...props }: FormLabelProps) => (
    <GenericFormLabel
        classes={{ root: "Tooltip", focused: "is-focused" }}
        {...props}
    >
        {content}
    </GenericFormLabel>
);
