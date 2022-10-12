import { FormLabel as GenericFormLabel, type FormLabelProps as GenericFromLabelProps } from "@mui/material";
import "./form-label.scss";

interface FormLabelProps extends GenericFromLabelProps {
    content: string | JSX.Element;
}

export const FormLabel = ({ content, ...props }: FormLabelProps) => (
    <GenericFormLabel {...{ props }}>{content}</GenericFormLabel>
);
