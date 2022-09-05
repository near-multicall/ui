import { BigSource } from "big.js";
import { Base64 } from "js-base64";
import {
    addMethod,
    BooleanSchema,
    MixedSchema,
    NumberSchema,
    StringSchema,
    ObjectSchema,
    ArraySchema,
    BaseSchema,
    AnySchema,
    ValidationError,
} from "yup";
import { ValidateOptions } from "yup/lib/types";
import { hasContract } from "./contracts/generic";
import Multicall from "./contracts/multicall";
import { SputnikDAO } from "./contracts/sputnik-dao";
import { Big, formatTokenAmount, parseTokenAmount, toGas, unit, unitToDecimals } from "./converter";

// ERRORS
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

type ArgsErrorOptions = { initial?: boolean; dummy?: boolean; customMessage?: string };
class ArgsError {
    isBad: boolean = false;
    error: ValidationError | null = null;
    customMessage: string | null = null;
    message: string = "";
    check: (value: any, validateOptions: ValidateOptions) => Promise<boolean>;

    constructor(schema: AnySchema | null, options?: ArgsErrorOptions) {
        if (options && options.customMessage) this.customMessage = options.customMessage;
        if (options && options.initial) this.isBad = options.initial;
        if (options && options.dummy)
            this.check = () => {
                this.error = new ValidationError("dummy");
                this.message = this.customMessage ?? this.error.message;
                return Promise.resolve(this.isBad);
            };
        else
            this.check = async (value: any, validateOptions: ValidateOptions) => {
                try {
                    await schema!.validate(value, validateOptions);
                    this.error = null;
                    this.isBad = false;
                    this.message = "";
                } catch (e: any) {
                    if (e instanceof ValidationError) {
                        this.error = e;
                        this.isBad = true;
                        this.message = this.customMessage ?? this.error.message;
                    }
                }
                return this.isBad;
            };
    }
}

// REGEX
// Regexp for NEAR account IDs. See: https://github.com/near/nearcore/blob/180e5dda991ad7bdbb389a931e84d24e31fb0674/core/account-id/src/lib.rs#L240
const rAddress: RegExp = /^(?=.{2,64}$)(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/;

// SCHEMATA
declare module "yup" {
    interface StringSchema {
        json(message?: string): this;
        address(message?: string): this;
        contract(message?: string): this;
        sputnikDao(message?: string): this;
        multicall(message?: string): this;
        intoUrl(): this;
    }
    interface ObjectSchema<TShape, TContext, TIn, TOut> extends BaseSchema<TIn, TContext, TOut> {
        call(): this;
        intoJsonString(): this;
        intoBase64String(): this;
        intoCallString(): this;
    }
}

// BigSchema
class BigSchema extends MixedSchema<Big> {
    constructor() {
        super({ type: "big" });
        this.spec.meta = {
            decimals: 0,
        };
    }

    // ensure value is greater equal than a minimum
    min(min: BigSource, message: string = locale.big.min) {
        return this.test({
            name: "min",
            params: { min },
            message,
            test: (value) => value == null || value.gte(min),
        });
    }

    // ensure value is less equal than a maximum
    max(max: BigSource, message: string = locale.big.max) {
        return this.test({
            name: "max",
            params: { max },
            message,
            test: (value) => value == null || value.lte(max),
        });
    }

    // TODO auto try to truncate value
    // ensure value does not have too many decimal places
    maxDecimalPlaces(
        decimalsOrUnit: number | unit = this.spec.meta.decimals,
        message: string = locale.big.maxDecimalPlaces
    ) {
        const decimals = typeof decimalsOrUnit === "number" ? decimalsOrUnit : unitToDecimals[decimalsOrUnit];
        return this.test({
            name: "maxDecimalPlaces",
            params: { decimals },
            message,
            test: (value) => value == null || !(value.toString().split(".")[1]?.length > decimals),
        }).meta({
            decimals,
        });
    }

    // short hand rule for gas values: 0 <= gas <= 300, gas input expected in Tgas per default
    gas(initialUnit: "gas" | "Tgas" = "Tgas") {
        return this.token(initialUnit).max(toGas("300"));
    }

    // short hand rule for token amount: 0 <= token and limited decimal places
    token(initialDecimalsOrUnit: number | unit) {
        return this.maxDecimalPlaces(initialDecimalsOrUnit).intoParsed().min(0);
    }

    // transform value to human readable value
    // decimals can be determined from direct input, unit input or from memory (via this.decimals)
    intoFormatted(decimalsOrUnit: number | unit = this.spec.meta.decimals) {
        const decimals = typeof decimalsOrUnit === "number" ? decimalsOrUnit : unitToDecimals[decimalsOrUnit];
        return this.transform((value) => new Big(formatTokenAmount(value, decimals))).meta({ decimals });
    }

    // transform value to indivisbile units
    // decimals can be determined from direct input, unit input or from memory (via this.decimals)
    intoParsed(decimalsOrUnit: number | unit = this.spec.meta.decimals) {
        const decimals = typeof decimalsOrUnit === "number" ? decimalsOrUnit : unitToDecimals[decimalsOrUnit];
        return this.transform((value) => new Big(parseTokenAmount(value, decimals))).meta({ decimals });
    }
}

// StringSchema
// TODO maybe yup.object().json() already does this?
// ensure string is json interpretable
addMethod(StringSchema, "json", function json(message = locale.string.json) {
    return this.test({
        name: "json",
        message,
        test: (value) => {
            if (value == null || value == "") return true;
            try {
                if (JSON.parse(value)) return false;
            } catch (e) {}
            return true;
        },
    });
});

// ensure string is a valid NEAR address
addMethod(StringSchema, "address", function address(message = locale.string.address) {
    return this.matches(rAddress, {
        name: "address",
        message,
        excludeEmptyString: false,
    });
});

// ensure string is a valid NEAR address with a contract
addMethod(StringSchema, "contract", function contract(message = locale.string.contract) {
    return this.address().test({
        name: "contract",
        message,
        test: async (value) => value == null || !!(await hasContract(value)),
    });
});

// ensure string is a valid NEAR address with a SputnikDAO contract
addMethod(StringSchema, "sputnikDao", function sputnikDao(message = locale.string.sputnikDao) {
    return this.contract().test({
        name: "sputnikDao",
        message,
        test: async (value) => value == null || !!(await SputnikDAO.isSputnikDAO(value)),
    });
});

// ensure string is a valid NEAR address with a multicall contract
addMethod(StringSchema, "multicall", function multicall(message = locale.string.multicall) {
    return this.contract().test({
        name: "multicall",
        message,
        test: async (value) => value == null || !!(await Multicall.isMulticall(value)),
    });
});

// transfrom address into URL
addMethod(StringSchema, "intoUrl", function intoUrl() {
    return this.address().transform((value) => `https://explorer.${window.NEAR_ENV}.near.org/accounts/${value}`);
});

// ObjectSchema
// ensure input value is valid call
addMethod(ObjectSchema, "call", function call() {
    return this.shape({
        address: args.string().address().required(),
        actions: args.array().of(
            args.object().shape({
                func: args.string().not([""]),
                args: args.object(),
                gas: args.big().gas(),
                depo: args.big().token("NEAR"),
            })
        ),
    });
});

// make json string from input value
addMethod(ObjectSchema, "intoJsonString", function intoJsonString() {
    return this.transform((value) => JSON.stringify(value));
});

// base64 encode input value
addMethod(ObjectSchema, "intoBase64String", function intoBase64String() {
    return this.transform((value) => Base64.encode(JSON.stringify(value)));
});

// base64 encode input value
addMethod(ObjectSchema, "intoCallString", function intoCallString() {
    return this.call().transform((value) => {
        const _value = value;
        _value.actions.forEach((a: { args: object | string }) => (a.args = Base64.encode(JSON.stringify(a.args))));
        return JSON.stringify(_value);
    });
});

export const args = {
    array: () => new ArraySchema(),
    big: () => new BigSchema(),
    boolean: () => new BooleanSchema(),
    number: () => new NumberSchema(),
    object: () => new ObjectSchema(),
    string: () => new StringSchema(),
    error: (schema: AnySchema, options?: ArgsErrorOptions) => new ArgsError(schema, options),
};

console.log(args.big().token("NEAR"));
