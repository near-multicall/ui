import { unitToDecimals, SIMPLE_NUM_REGEX, convert, Big } from "./converter";
import { BigSource } from "big.js";

export default abstract class Args {

    private types = {
        "boolean":  ArgsBool,
        "string":   ArgsString, 
        "account":  ArgsAccount,
        "number":   ArgsNumber,
        "big":      ArgsBig, 
        "object":   ArgsObject, 
        "array":    ArgsArray,
        "json":     ArgsJSON
    };

    type: string;
    value: any;
    min: number | Big | null;
    max: number | Big | null;
    unit: string | null;
    decimals: number | null;

    omit = false;

    constructor(
        type: string, 
        value: any, 
        min: number | Big | null = null, 
        max: number | Big | null = null,
        unit: string | null = null,
        decimals: number | null = null
    ) {

        // test if type is valid
        if ( !Object.keys(this.types).includes(type) ) {
            console.error(`invalid args type ${type}.`);
        }
        
        this.type = type;
        this.value = value;
        this.min = min;
        this.max = max;
        this.unit = unit;
        this.decimals = decimals;

    }

    toString = () => this.value.toString();

    getUnit = (): {} => ({
        unit: this.unit,
        decimals: this.decimals ??  unitToDecimals[this.unit!]
    });

}

class ArgsBool extends Args {

    constructor(value: boolean) {

        super("boolean", value);

    }

}

class ArgsString extends Args {

    constructor(value: string) {

        super("string", value);

    }

}

class ArgsAccount extends Args {

    // Regexp for NEAR account IDs. See: https://github.com/near/nearcore/blob/180e5dda991ad7bdbb389a931e84d24e31fb0674/core/account-id/src/lib.rs#L240
    static ACCOUNT_ID_REGEX: RegExp = /^(?=.{2,64}$)(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/;

    constructor(value: string) {

        super("string", value);

    }

    static isValid = (value: ArgsAccount | string): boolean => {
        if (typeof value === "string") {
            value = new ArgsAccount(value);
        }

        return this.ACCOUNT_ID_REGEX.test(value.value)
    };

    isValid = (): boolean => ArgsAccount.isValid(this);

    toUrl = () => `https://explorer.${window.NEAR_ENV}.near.org/accounts/${this.value}`;

    static toUrl = (address: string) => `https://explorer.${window.NEAR_ENV}.near.org/accounts/${address}`;

}

class ArgsNumber extends Args {

    constructor(
        value: number, 
        min?: number | null, 
        max?: number | null, 
        unit?: string | null,
        decimals?: number | null
    ) {

        super("number", value, min, max, unit, decimals);

    }

    static isValid = (value: ArgsNumber): boolean => {

        // test if number
        if ( ! SIMPLE_NUM_REGEX.test(value.value.toString()) ) {
            return false;
        }

        // Try to initialize, otherwise assign undefined
        let decimals: number | undefined = value.decimals ?? (value.unit ? unitToDecimals[value.unit] : undefined);

        if ((decimals !== undefined) && (value.value.toString().split(".")[1]?.length > decimals)) {
            return false;
        }

        const v = convert(value.value, value.unit, decimals);

        return (value.min === null || Big(v).gte(value.min)) 
            && (value.max === null || Big(v).lte(value.max));
    }

    isValid = (): boolean => ArgsNumber.isValid(this);

}

class ArgsBig extends Args {

    big: Big;

    constructor(
        value: BigSource, 
        min: BigSource | null = null, 
        max: BigSource | null = null, 
        unit?: string | null,
        decimals?: number | null
    ) {

        super("big", value, (min !== null) ? Big(min) : null, (max !== null) ? Big(max) : null, unit ?? "unknown", decimals);

        this.big = Big(value);

    }

    static isValid = (value: ArgsBig): boolean => {

        // test if number
        if ( ! SIMPLE_NUM_REGEX.test(value.value.toString()) ) {
            return false;
        }

        // Try to initialize, otherwise assign undefined
        let decimals: number | undefined = value.decimals ?? (value.unit ? unitToDecimals[value.unit] : undefined);

        if ((decimals !== undefined) && (value.value.split(".")[1]?.length > decimals)) {
            return false;
        }

        const v = convert(value.value, value.unit, decimals);

        return (value.min === null || Big(v).gte(value.min)) 
            && (value.max === null || Big(v).lte(value.max));
    }

    isValid = (): boolean => ArgsBig.isValid(this);

}

class ArgsObject extends Args {

    constructor(value: object) {

        super("object", value);

        for (let k in value)
            if (!(value[k] instanceof Args))
                console.error(`all children of ArgsObject need to be of type Args (or extending Args), ${value[k]} is of type ${typeof value[k]}`);
            
    }

    toString = () => {

        let res = {};

        for (let k in this.value)
            if (!this.value[k].omit)
                res[k] = convert(this.value[k].value, this.value[k].unit, this.value[k].decimals).toString();

        return res; // JSON.stringify(res, null, "  ");

    }

    getUnit = () => {

        let res = {};

        for (let k in this.value)
            if (!this.value[k].omit)
                res[k] = this.value[k].getUnit();

        return res;

    }

}

class ArgsArray extends Args {

    constructor() {

        super("array", [...arguments]);

    }

    toString = () => this.value.map(x => x.toString());

    // getUnit: () => this.value.map(x => x.getUnit());

}

class ArgsJSON extends Args {

    constructor(value: string) {

        super("json", value);

        if (typeof value !== "string")
            console.error("ArgsJSON expected string, but got", value);

    }

    toString = () => {
        
        if (!this.isValid()) {
            console.error(`invalid JSON ${this.value} on ArgsJSON`);
        } else
            return JSON.parse(this.value);

    }

    isValid = (): boolean => {

        try {
            JSON.parse(this.value);
        } catch(e) {
            return false;
        }

        return true;
    }

}

class ArgsError {

    isBad: boolean;
    intermediate: any;
    message: string;
    validator: (value: any) => boolean;

    constructor(message: string, validator: (value: any) => boolean, isBad: boolean = false, intermediate: any = null) {

        this.isBad = isBad;
        this.intermediate = intermediate;
        this.message = message;
        this.validator = validator;

    }

    validOrNull(value: any) {

        let valid = false;
        try {
            if (this.validator(value)) valid = true;
        } catch(e) {
            this.intermediate = value.value;
        }
         
        this.isBad = !valid;

        return valid
            ? value
            : null

    }

}

export {
    Args,
    ArgsBool,
    ArgsString, 
    ArgsAccount,
    ArgsNumber,
    ArgsBig, 
    ArgsObject, 
    ArgsArray,
    ArgsJSON,
    ArgsError
}
