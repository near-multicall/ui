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

type retainOptions = { initial?: boolean; dummy?: boolean; customMessage?: string };

// store information on last evaluation in meta data
function retain(this: any, options?: retainOptions) {
    return this.meta({
        retained: this.spec.meta?.retained ?? {
            error: null,
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
        this.validateSync(value, validateOptions);
        const ret = this.spec.meta?.retained;
        if (!!ret && !ret.dummy)
            this.spec.meta.retained = {
                ...ret,
                error: null,
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
        await this.validate(value, validateOptions);
        const ret = this.spec.meta?.retained;
        if (!!ret && !ret.dummy)
            this.spec.meta.retained = {
                ...ret,
                error: null,
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
                    isBad: true,
                    message: ret.customMessage ?? e.message,
                    lastValue: value,
                };
        }
        return false;
    }
}

// see if last evaluation was bad
function isBad(this: any): boolean | null {
    return this.spec.meta?.retained?.isBad;
}

// see any errors that occured in last evaluation
function error(this: any): ValidationError | null {
    return this.spec.meta?.retained?.error;
}

// get the (custom) error message for this schema
function message(this: any): string {
    return this.spec.meta?.retained?.message;
}

// see what value was processed in last evaluation
function lastValue(this: any): any {
    return this.spec.meta?.retained?.lastValue;
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
        message,
        lastValue,
    });
}

export { addMethods, addErrorMethods, locale };
export type { retainOptions };
