import { ConnectedField, ConnectedFields, ErrorTextMap, FieldConfig, FormConfig } from "effector-forms/dist-types";
import React from "react";
import { addMethods } from "./args-error";
import { fieldType, NormalField } from "./fields";

// Type definitions

type Rule = {
    name: string;
    validator: (v: any) => Promise<{
        isValid: boolean;
        value: any;
        errorText?: string;
    }>;
};

type FormInfo = {
    fields: ConnectedFields<any>;
    hasError: (fieldName?: string) => boolean;
    errorText: (fieldName: string, map?: ErrorTextMap) => string;
};

interface FieldMethods {
    intoRule(name: string): Rule;
    intoFieldConfig(fieldName: string): FieldConfig<any>;
    intoFormConfig(options?: object): FormConfig<any>;
    intoField(
        formInfo: FormInfo,
        fieldName: string,
        options?: {
            type?: fieldType;
            props?: React.HTMLProps<any>;
            preChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
            postChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
        }
    ): JSX.Element;
}

// Implementation

function intoRule(this: any, name: string) {
    return {
        name,
        validator: async (v: any) => {
            await this.check(v);
            const valid = !this.isBad();
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
        init: this.getDefault() ?? "",
        rules: [this.intoRule(fieldName)],
        validateOn: ["change"],
    };
}

function intoFormConfig(this: any, options?: object) {
    if (this.fields === undefined) {
        console.error("cannot derive form config from non-args-object");
        return {};
    }
    const fields = Object.fromEntries(Object.entries(this.fields).map(([k, v]) => [k, (v as any).intoFieldConfig(k)]));
    return {
        fields,
        ...options,
    };
}

function intoField(
    this: any,
    formInfo: FormInfo,
    fieldName: string,
    options?: {
        type?: fieldType;
        props?: React.HTMLProps<any>;
        preChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
        postChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    }
) {
    const field: ConnectedField<string> = formInfo.fields[fieldName];
    const type = options?.type ?? fieldType.NORMAL;
    switch (type) {
        case fieldType.NORMAL:
            return React.createElement(
                NormalField,
                {
                    value: field.value,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                        options?.preChange?.(e);
                        field.onChange((e.target as HTMLInputElement).value);
                        options?.postChange?.(e);
                    },
                    fieldName,
                    formInfo,
                    errorText: this.message(),
                    ...(options?.props ?? {}),
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
export type { Rule, FieldConfig, FormInfo, FieldMethods };
