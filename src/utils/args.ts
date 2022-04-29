import { convert } from "./converter";

export default abstract class Args {

    private types = {
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
    min: number | BigInt | null;
    max: number | BigInt | null;
    unit: string | null;
    decimals: number | null;

    omit = false;

    constructor(
        type: string, 
        value: any, 
        min?: number | BigInt | null, 
        max?: number | BigInt | null,
        unit?: string | null,
        decimals?: number | null
    ) {

        // test if type is valid
        if (!Object.keys(this.types).includes(type))
            console.error(`invalid args type ${type}.`);
        
        this.type = type;
        this.value = value;
        this.min = min;
        this.max = max;
        this.unit = unit;
        this.decimals = decimals;

    }

    toString = () => this.value.toString();

    getUnit = () => this.unit;

}

class ArgsString extends Args {

    constructor(value: string) {

        super("string", value);

    }

}

class ArgsAccount extends Args {

    constructor(value: string) {

        super("string", value);

    }

    static isValid = (value: ArgsAccount | string) => {
        if (typeof value === "string")
            value = new ArgsAccount(value);
        return /^(?=.{2,64}$)(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/.test(value.value)
    };

    isValid = () => ArgsAccount.isValid(this);

    toNet = () => this.value.split(".").pop() === "testnet" ? "testnet" : "mainnet";

    toUrl = (net = this.toNet()) => `https://explorer.${net}.near.org/accounts/${this.value}`;

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

    static isValid = (value: ArgsNumber) => {

        const decimals = value.decimals ?? {
            NEAR: 24,
            yocto: 0,
            Tgas: 12,
            gas: 0
        }[value.unit]

        if (decimals !== undefined && value.value.toString().split(".")[1]?.length > decimals)
            return false;

        const v = convert(value.value, value.unit, decimals);

        return (value.min === null || v >= value.min) 
            && (value.max === null || v <= value.max);

    }

    isValid = () => ArgsNumber.isValid(this);

}

class ArgsBig extends Args {

    big: BigInt;

    constructor(
        value: string, 
        min: string = null, 
        max: string = null, 
        unit?: string | null,
        decimals?: number | null
    ) {

        super("big", value, (min !== null) ? BigInt(min) : null, (max !== null) ? BigInt(max) : null, unit ?? "unknown", decimals);

        this.big = BigInt(value);

    }

    static isValid = (value: ArgsBig) => {

        const decimals = value.decimals ?? {
            NEAR: 24,
            yocto: 0,
            Tgas: 12,
            gas: 0
        }[value.unit]

        if (decimals !== undefined && value.value.split(".")[1]?.length > decimals)
            return false;

        const v = convert(value.value, value.unit, decimals);

        return (value.min === null || BigInt(v) >= value.min) 
            && (value.max === null || BigInt(v) <= value.max);

    }

    isValid = () => ArgsBig.isValid(this);

}

class ArgsObject extends Args {

    constructor(value: object) {

        super("object", value);

        for (let k in value)
            if (!(value[k] instanceof Args))
                console.error(`all children of ArgsObject need to be of type Args (or extending Args), ${value[k]} is of type ${typeof value[k]}`);
            
    }

    toString = () => {

        const decimals = (value: Args): number => value.decimals ?? {
            NEAR: 24,
            yocto: 0,
            Tgas: 12,
            gas: 0
        }[value.unit]

        let res = {};

        for (let k in this.value)
            if (!this.value[k].omit)
                res[k] = convert(this.value[k].value, this.value[k].unit, decimals(this.value[k])).toString();

        return res; // JSON.stringify(res, null, "  ");

    }

}

class ArgsArray extends Args {

    constructor() {

        super("array", [...arguments]);

    }

    toString = () => this.value.map(x => x.toString());

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

    isValid = () => {

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

        let valid = true;
        try {
            if (!this.validator(value))
                valid = false;
        } catch(e) {
            valid = false;
            this.intermediate = value;
        }
         
        this.isBad = !valid;

        return valid
            ? value
            : null

    }

}

export {
    Args,
    ArgsString, 
    ArgsAccount,
    ArgsNumber,
    ArgsBig, 
    ArgsObject, 
    ArgsArray,
    ArgsJSON,
    ArgsError
}