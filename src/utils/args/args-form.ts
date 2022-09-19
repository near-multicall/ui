import { ConnectedField } from "effector-forms/dist-types";
import React from "react";
import { addMethods } from "./args-error";
import { fieldType, NormalField } from "./args-types/fields";

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

function intoFieldModel(this: any, name: string) {
    return {
        [name]: {
            init: this.getDefault(),
            rules: [this.intoRule(name)],
            validateOn: ["change"],
        },
    };
}

function intoFormModel(this: any, options?: object) {
    const fields = Object.fromEntries(Object.entries(this.fields).map(([k, v]) => (v as any).intoFieldModel(k)));
    return {
        fields,
        ...options,
    };
}

function intoField(field: ConnectedField<string>, type: fieldType = fieldType.NORMAL) {
    switch (type) {
        case fieldType.NORMAL:
            return React.createElement(
                NormalField,
                { value: field.value, onChange: (e) => field.onChange((e.target as HTMLInputElement).value) },
                null
            );
    }
}

function addFieldMethods(schema: any): void {
    addMethods(schema, {
        intoRule,
        intoFieldModel,
        intoFormModel,
        intoField,
    });
}

export { addFieldMethods };
