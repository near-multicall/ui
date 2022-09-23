import { ConnectedField } from "effector-forms/dist-types";
import React from "react";
import { addMethods } from "./args-error";
import { fieldType, FormInfo, NormalField } from "./fields";

function intoRule(this: any, name: string) {
    return {
        name,
        validator: (v: any) => {
            const valid = this.check(v);
            return {
                isValid: valid,
                value: v,
                errorText: valid ? undefined : this.message(),
            };
        },
    };
}

function intoFieldConfig(this: any, fieldName: string) {
    return {
        [fieldName]: {
            init: this.getDefault() ?? "",
            rules: [this.intoRule(fieldName)],
            validateOn: ["change"],
        },
    };
}

function intoFormConfig(this: any, options?: object) {
    const fields = !!this.fields
        ? Object.fromEntries(Object.entries(this.fields).map(([k, v]) => [k, (v as any).intoFieldConfig(k)]))
        : { error: this.intoFieldConfig("error") };
    return {
        fields,
        ...options,
    };
}

function intoField(this: any, formInfo: FormInfo, fieldName: string, type: fieldType = fieldType.NORMAL) {
    const field: ConnectedField<string> = formInfo.fields[fieldName];
    switch (type) {
        case fieldType.NORMAL:
            return React.createElement(
                NormalField,
                {
                    value: field.value,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                        field.onChange((e.target as HTMLInputElement).value),
                    fieldName,
                    formInfo,
                    errorText: this.message(),
                },
                null
            );
    }
}

function addFieldMethods(schema: any): void {
    addMethods(schema, {
        intoRule,
        intoFieldConfig,
        intoFormConfig,
        intoField,
    });
}

export { addFieldMethods };
