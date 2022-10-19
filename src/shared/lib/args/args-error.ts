import { addMethod, ValidationError } from "yup";
import { ValidateOptions } from "yup/lib/types";

// default error messages go here
const locale = {
    big: {
        invalid: "invalid value",
        min: "value must be at least ${min}",
        max: "value must be at most ${max}",
        format: "failed to format value",
        parse: "failed to parse value",
        maxDecimalPlaces: "value has too many decimal places",
    },
    string: {
        json: "value must be a valid json string",
        address: "value must be a valid address",
        contract: "value must have a contract deployed",
        sputnikDao: "address must belong to a sputnik dao contract",
        multicall: "address must belong to a multicall contract",
        ft: "address must belong to a token contract",
        mft: "token id must belong to a multi-token contract",
    },
};

// Type definitions

type RetainOptions = {
    initial: boolean;
    dummy: boolean;
    customMessage: string;
    customValue: any;
};

type RetainedData = {
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
    retain(options?: Partial<RetainOptions>): this;
    checkSync(value: any, validateOptions?: ValidateOptions): void;
    check(value: any, validateOptions?: ValidateOptions): Promise<void>;
    isBad(isBad?: boolean): boolean | null;
    error(): ValidationError | null;
    errors(): ValidationError[] | null;
    message(): string;
    messages(): string[];
    lastValue(): any;
    combine(errors: this[], options?: Partial<RetainOptions>): this;
}

/**
 * store information on last evaluation in meta data
 * @param {RetainOptions} options
 * @returns
 */
function retain(this: any, options?: Partial<RetainOptions>) {
    return this.meta({
        retained:
            this.spec.meta?.retained ??
            <RetainedData>{
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

/**
 * synchronously check if value is valid, retain evaluation details in meta data
 * @param value
 * @param validateOptions
 * @returns
 */
function checkSync(this: any, value: any, validateOptions?: ValidateOptions): void {
    return this._checkSync(this.cast(value), null, validateOptions);
}

function _checkSync(this: any, value: any, parent: any, validateOptions?: ValidateOptions): void {
    if (this.type === "object" && !this.spec.meta?.retained?.ignoreAll) {
        const ret = this.spec.meta?.retained;
        const fields = Object.entries(this.fields).filter(([k, v]) => !ret?.ignoreFields?.includes(k));
        fields.forEach(([k, v]) => (v as any)._checkSync(value[k], value, validateOptions));
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
            this.validateSync(ret?.customValue ?? value, { ...validateOptions, parent });
            if (!!ret && !ret.dummy)
                this.spec.meta.retained = {
                    ...ret,
                    error: null,
                    errors: [],
                    isBad: false,
                    message: "",
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

/**
 * asynchronusly check if value is valid, retain evaluation details in meta data
 * @param value
 * @param validateOptions
 * @returns
 */
async function check(this: any, value: any, validateOptions?: ValidateOptions): Promise<void> {
    return await this._check(this.cast(value), null, validateOptions);
}

async function _check(this: any, value: any, parent: any, validateOptions?: ValidateOptions): Promise<void> {
    if (this.type === "object" && !this.spec.meta?.retained?.ignoreAll) {
        const ret = this.spec.meta?.retained;
        const fields = Object.entries(this.fields).filter(([k, v]) => !ret?.ignoreFields?.includes(k));
        await Promise.all(fields.map(async ([k, v]) => await (v as any)._check(value[k], value, validateOptions)));
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
            await this.validate(ret?.customValue ?? value, { ...validateOptions, parent });
            if (!!ret && !ret.dummy)
                this.spec.meta.retained = {
                    ...ret,
                    error: null,
                    errors: [],
                    isBad: false,
                    message: "",
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

/**
 * see if last evaluation was bad / set isBad property manually
 * @param isBad
 * @returns
 */
function isBad(this: any, isBad?: boolean): boolean | null {
    if (isBad === true || isBad === false) this.spec.meta.retained.isBad = isBad;
    return this.spec.meta?.retained?.isBad ?? null;
}

/**
 * see an errors that occured in last evaluation
 * @returns
 */
function error(this: any): ValidationError | null {
    return this.spec.meta?.retained?.error ?? null;
}

/**
 * see all errors that occured in last evaluation
 * @returns
 */
function errors(this: any): ValidationError[] | null {
    return this.spec.meta?.retained?.errors ?? [];
}

/**
 * get the (custom) error message for this schema
 * @returns
 */
function message(this: any): string {
    return this.spec.meta?.retained?.message ?? "";
}

/**
 * get the (custom) error message for this schema
 * @returns
 */
function messages(this: any): string[] {
    return this.spec.meta?.retained?.messages ?? [];
}

/**
 * see what value was processed in last evaluation
 * @returns
 */
function lastValue(this: any): any {
    return this.spec.meta?.retained?.lastValue ?? null;
}

/**
 * combine other errors
 * @param errors
 * @param options
 * @returns
 */
function combine(this: any, errors: any[], options?: Partial<RetainOptions>) {
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

/**
 * add multiple methods at once
 * @param schema
 * @param fns
 */
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
export type { RetainOptions, RetainedData, ErrorMethods };
