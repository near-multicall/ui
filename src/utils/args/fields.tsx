import React from "react";
import { FormInfo } from "./args-form";

enum fieldType {
    NORMAL,
}

interface NormalFieldProps extends React.HTMLProps<HTMLInputElement> {
    fieldName: string;
    formInfo: FormInfo;
    errorText: string;
}

const NormalField = ({ value, onChange, fieldName, formInfo, errorText, ...props }: NormalFieldProps) => (
    <>
        <input
            type="text"
            value={value}
            onChange={onChange}
            {...props}
        />
        <div className="error-text">
            {formInfo.errorText(fieldName, {
                fieldName: errorText,
            })}
        </div>
    </>
);

export { fieldType, NormalField };
