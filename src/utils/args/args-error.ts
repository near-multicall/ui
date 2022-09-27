import { addMethod, ValidationError } from "yup";
import { ValidateOptions } from "yup/lib/types";

// default error messages go here
const locale = {
    big: {
        min: "value must be at least ${min}",
        max: "value must be at most ${max}",
        maxDecimalPlaces: "value must not have more than ${decimals} decimal places",
    },
    string: {
        json: "value must be a valid json string",
        address: "value must be a valid address",
        contract: "value must have a contract deployed",
        sputnikDao: "address must belong to a sputnik dao contract",
        multicall: "address must belong to a multicall contract",
    },
};

// Type definitions

type retainOptions = {
    initial?: boolean;
    dummy?: boolean;
    customMessage?: string;
    customValue?: any;
};

type retainedData = {
    error: ValidationError | null;
    errors: ValidationError[];
    isBad: boolean;
    customMessage: string | null;
    customValue: any | null;
    message: string;
    messages: string[];
    dummy: boolean;
    lastValue: any | null;
    initial?: boolean;
    ignoreFields?: string[];
    ignoreAll?: boolean;
};

interface ErrorMethods {
    retain(options?: retainOptions): this;
    checkSync(value: any, validateOptions: ValidateOptions): void;
    check(value: any, validateOptions: ValidateOptions): Promise<void>;
    isBad(isBad?: boolean): boolean | null;
    error(): ValidationError | null;
    errors(): ValidationError[] | null;
    message(): string;
    messages(): string[];
    lastValue(): any;
    combine(errors: this[], options?: retainOptions): this;
}

// store information on last evaluation in meta data
function retain(this: any, options?: retainOptions) {
    return this.meta({
        retained:
            this.spec.meta?.retained ??
            <retainedData>{
                error: null,
                errors: [],
                isBad: false,
                customMessage: null,
                message: "",
                messages: [],
                dummy: false,
                lastValue: null,
                ...options,
            },
    });
}

function checkSync(this: any, value: any, validateOptions: ValidateOptions): void {
    return this._checkSync(this.cast(value), validateOptions);
}

// check if value is valid, retain evaluation details in meta data
function _checkSync(this: any, value: any, validateOptions: ValidateOptions): void {
    if (this.type === "object" && !this.spec.meta?.retained?.ignoreAll) {
        const ret = this.spec.meta?.retained;
        const fields = Object.entries(this.fields).filter(([k, v]) => !ret?.ignoreFields?.includes(k));
        fields.forEach(([k, v]) => (v as any).checkSync(value[k], validateOptions));
        const errors = fields.map(([k, v]) => (v as any).errors()).flat();
        const messages = fields
            .map(([k, v]) => (v as any).messages())
            .filter((m) => m !== "")
            .flat();
        if (!!ret && !ret.dummy)
            this.spec.meta.retained = {
                ...ret,
                error: errors[0],
                errors,
                isBad: fields.some(([k, v]) => (v as any).isBad()),
                lastValue: value,
                message: ret.customMessage ?? messages[0],
                messages,
            };
    } else {
        try {
            const ret = this.spec.meta?.retained;
            this.validateSync(ret?.customValue ?? value, validateOptions);
            if (!!ret && !ret.dummy)
                this.spec.meta.retained = {
                    ...ret,
                    error: null,
                    errors: [],
                    isBad: false,
                    message: "checked",
                    messages: [],
                    lastValue: value,
                };
        } catch (e: any) {
            if (e instanceof ValidationError) {
                const ret = this.spec.meta?.retained;
                if (!!ret && !ret.dummy)
                    this.spec.meta.retained = {
                        ...ret,
                        error: e,
                        errors: [e],
                        isBad: true,
                        message: ret.customMessage ?? e.message,
                        messages: [ret.customMessage ?? e.message],
                        lastValue: value,
                    };
            } else {
                console.error(e);
            }
        }
    }
}

async function check(this: any, value: any, validateOptions: ValidateOptions): Promise<void> {
    return await this._check(this.cast(value), validateOptions);
}

// asynchronusly check if value is valid, retain evaluation details in meta data
async function _check(this: any, value: any, validateOptions: ValidateOptions): Promise<void> {
    if (this.type === "object" && !this.spec.meta?.retained?.ignoreAll) {
        const ret = this.spec.meta?.retained;
        const fields = Object.entries(this.fields).filter(([k, v]) => !ret?.ignoreFields?.includes(k));
        await Promise.all(fields.map(async ([k, v]) => await (v as any)._check(value[k], validateOptions)));
        const errors = fields.map(([k, v]) => (v as any).errors()).flat();
        const messages = fields
            .map(([k, v]) => (v as any).messages())
            .filter((m) => m !== "")
            .flat();
        if (!!ret && !ret.dummy)
            this.spec.meta.retained = {
                ...ret,
                error: errors[0],
                errors,
                isBad: fields.some(([k, v]) => (v as any).isBad()),
                lastValue: value,
                message: ret.customMessage ?? messages[0],
                messages,
            };
    } else {
        try {
            const ret = this.spec.meta?.retained;
            await this.validate(ret?.customValue ?? value, validateOptions);
            if (!!ret && !ret.dummy)
                this.spec.meta.retained = {
                    ...ret,
                    error: null,
                    errors: [],
                    isBad: false,
                    message: "checked",
                    messages: [],
                    lastValue: value,
                };
        } catch (e: any) {
            if (e instanceof ValidationError) {
                const ret = this.spec.meta?.retained;
                if (!!ret && !ret.dummy)
                    this.spec.meta.retained = {
                        ...ret,
                        error: e,
                        errors: [e],
                        isBad: true,
                        message: ret.customMessage ?? e.message,
                        messages: [ret.customMessage ?? e.message],
                        lastValue: value,
                    };
            } else {
                console.error(e);
            }
        }
    }
}

// see if last evaluation was bad / set isBad property manually
function isBad(this: any, isBad?: boolean): boolean | null {
    if (isBad === true || isBad === false) this.spec.meta.retained.isBad = isBad;
    return this.spec.meta?.retained?.isBad;
}

// see an errors that occured in last evaluation
function error(this: any): ValidationError | null {
    return this.spec.meta?.retained?.error;
}

// see all errors that occured in last evaluation
function errors(this: any): ValidationError[] | null {
    return this.spec.meta?.retained?.errors;
}

// get the (custom) error message for this schema
function message(this: any): string {
    return this.spec.meta?.retained?.message;
}

// get the (custom) error message for this schema
function messages(this: any): string[] {
    return this.spec.meta?.retained?.messages;
}

// see what value was processed in last evaluation
function lastValue(this: any): any {
    return this.spec.meta?.retained?.lastValue;
}

// combine other errors
function combine(this: any, errors: any[], options?: retainOptions) {
    return this.retain(options).meta({
        retained: {
            error: errors[0].error(),
            errors: errors.map((e) => e.errors()).flat(),
            isBad: errors.some((e) => e.isBad()),
            message: this.spec.meta.retained.customMessage ?? errors[0].message,
            messages: errors.map((e) => e.errors()).flat(),
            ...this.spec.meta.retained,
        },
    });
}

// add multiple methods at once
function addMethods(schema: any, fns: object): void {
    Object.entries(fns).forEach(([k, v]) => addMethod(schema, k, v));
}

function addErrorMethods(schema: any): void {
    addMethods(schema, {
        retain,
        _checkSync,
        checkSync,
        _check,
        check,
        isBad,
        error,
        errors,
        message,
        messages,
        lastValue,
        combine,
    });
}

export { addMethods, addErrorMethods, locale };
export type { retainOptions, retainedData, ErrorMethods };