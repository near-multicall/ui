import { addMethod, AnySchema, ValidationError } from "yup";
import Reference from "yup/lib/Reference";
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

type retainOptions = { initial?: boolean; dummy?: boolean; customMessage?: string; customValue?: any };

// store information on last evaluation in meta data
function retain(this: any, options?: retainOptions) {
    return this.meta({
        retained: this.spec.meta?.retained ?? {
            error: null,
            errors: [],
            isBad: false,
            customMessage: null,
            message: "",
            dummy: false,
            lastValue: null,
            ...options,
        },
    });
}

// check if value is valid, retain evaluation details in meta data
function check(this: any, value: any, validateOptions: ValidateOptions): boolean {
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
                lastValue: value,
            };
        return true;
    } catch (e: any) {
        if (e instanceof ValidationError) {
            const ret = this.spec.meta?.retained;
            if (!!ret && !ret.dummy)
                this.spec.meta.retained = {
                    ...ret,
                    error: e,
                    errors: [],
                    isBad: true,
                    message: ret.customMessage ?? e.message,
                    lastValue: value,
                };
        }
        return false;
    }
}

// asynchronusly check if value is valid, retain evaluation details in meta data
async function checkAsync(this: any, value: any, validateOptions: ValidateOptions): Promise<boolean> {
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
                lastValue: value,
            };
        return true;
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
                    lastValue: value,
                };
        }
        return false;
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

// see what value was processed in last evaluation
function lastValue(this: any): any {
    return this.spec.meta?.retained?.lastValue;
}

// override value to a sibling reference
function checkOn(this: any, ref: Reference) {
    this.retain();
    const ret = this.spec.meta.retained;
    return this.meta({
        retained: {
            customValue: this.resolve(ref),
            ...ret,
        },
    });
}

// combine other errors
function combine(this: any, errors: any[], options?: retainOptions) {
    this.retain(options);
    const ret = this.spec.meta.retained;
    return this.meta({
        retained: {
            error: errors[0].error(),
            errors: errors.map((e) => e.errors()).flat(),
            isBad: errors.some((e) => e.isBad()),
            message: ret.customMessage ?? errors.map((e) => e.message).join(", "),
            ...ret,
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
        check,
        checkAsync,
        isBad,
        error,
        errors,
        message,
        lastValue,
        checkOn,
        combine,
    });
}

export { addMethods, addErrorMethods, locale };
export type { retainOptions };
