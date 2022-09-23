import { ConnectedFields, ErrorTextMap } from "effector-forms/dist-types";
import React from "react";

enum fieldType {
    NORMAL,
}

type FormInfo = {
    fields: ConnectedFields<any>;
    hasError: (fieldName?: string) => boolean;
    errorText: (fieldName: string, map?: ErrorTextMap) => string;
};

interface NormalFieldProps extends React.HTMLProps<HTMLInputElement> {
    fieldName: string;
    formInfo: FormInfo;
    errorText: string;
}

const NormalField = ({ value, onChange, fieldName, formInfo, errorText }: NormalFieldProps) => (
    <>
        <input
            type="text"
            value={value}
            onChange={onChange}
        />
        <div className="error-text">
            {formInfo.errorText(fieldName, {
                fieldName: errorText,
            })}
        </div>
    </>
);

export { fieldType, NormalField };
export type { FormInfo };
