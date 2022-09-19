import { useEffect, useMemo, useReducer } from "react";
import { BigSource } from "big.js";
import { Validation } from "./validation";

import { SputnikDAO } from "./contracts/sputnik-dao";
import { unitToDecimals, convert, Big } from "./converter";

export default abstract class Args {
    private types = {
        string: ArgsString,
        account: ArgsAccount,
        number: ArgsNumber,
        big: ArgsBig,
        object: ArgsObject,
        array: ArgsArray,
        json: ArgsJSON,
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
        if (!Object.keys(this.types).includes(type)) {
            console.error(`invalid args type ${type}.`);
        }

        this.type = type;
        this.value = value;
        this.min = min;
        this.max = max;
        this.unit = unit;
        this.decimals = decimals;
    }

    static equals = (oneInstance: Args, anotherInstance: Args) => oneInstance.value === anotherInstance.value;

    equals = (anotherInstance: Args) => Args.equals(this, anotherInstance);

    toString = () => this.value.toString();

    getUnit = (): {} => ({
        unit: this.unit,
        decimals: this.decimals ?? unitToDecimals[this.unit!],
    });
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

    /**
     * Deconstructs given NEAR address into its parent address, and a name.
     * Parent address for a Top Level Account (TLA) is "".
     *
     * Examples:
     *   1- "potato.example.near" becomes: {name: "potato", parentAddress: "example.near"}
     *   2- "near" becomes {name: "potato", parentAddress: ""}
     *
     * @param address address to get its NEAR parent account
     * @returns
     */
    static deconstructAddress = (address: string): { name: string; parentAddress: string } => {
        const deconstructedAddr = address.split(".");
        const result = { name: deconstructedAddr[0], parentAddress: "" };
        // address has a parent account (not TLA)
        if (deconstructedAddr.length > 1) {
            deconstructedAddr.splice(0, 1);
            result.parentAddress = deconstructedAddr.join(".");
        }

        return result;
    };

    deconstructAddress = () => ArgsAccount.deconstructAddress(this.value);

    static isValid = (value: ArgsAccount | string): boolean => {
        if (typeof value === "string") {
            value = new ArgsAccount(value);
        }

        return Validation.isNearAccountId(value.value);
    };

    isValid = (): boolean => ArgsAccount.isValid(this);

    toUrl = () => `https://explorer.${window.NEAR_ENV}.near.org/accounts/${this.value}`;
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
        if (!Validation.isSimpleNumberStr(value.value.toString())) {
            return false;
        }

        // Try to initialize, otherwise assign undefined
        let decimals: number | undefined = value.decimals ?? (value.unit ? unitToDecimals[value.unit] : undefined);

        if (decimals !== undefined && value.value.toString().split(".")[1]?.length > decimals) {
            return false;
        }

        const v = convert(value.value, value.unit, decimals);

        return (value.min === null || Big(v).gte(value.min)) && (value.max === null || Big(v).lte(value.max));
    };

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
        super(
            "big",
            value,
            min !== null ? Big(min) : null,
            max !== null ? Big(max) : null,
            unit ?? "unknown",
            decimals
        );

        this.big = Big(value);
    }

    static isValid = (value: ArgsBig): boolean => {
        // test if number
        if (!Validation.isSimpleNumberStr(value.value.toString())) {
            return false;
        }

        // Try to initialize, otherwise assign undefined
        let decimals: number | undefined = value.decimals ?? (value.unit ? unitToDecimals[value.unit] : undefined);

        if (decimals !== undefined && value.value.split(".")[1]?.length > decimals) {
            return false;
        }

        const v = convert(value.value, value.unit, decimals);

        return (value.min === null || Big(v).gte(value.min)) && (value.max === null || Big(v).lte(value.max));
    };

    isValid = (): boolean => ArgsBig.isValid(this);
}

class ArgsObject extends Args {
    constructor(value: object) {
        super("object", value);

        for (let k in value)
            if (!(value[k] instanceof Args))
                console.error(
                    `all children of ArgsObject need to be of type Args (or extending Args), ${
                        value[k]
                    } is of type ${typeof value[k]}`
                );
    }

    toString = () => {
        let res = {};

        for (let k in this.value)
            if (!this.value[k].omit)
                res[k] = convert(this.value[k].value, this.value[k].unit, this.value[k].decimals).toString();

        return res; // JSON.stringify(res, null, "  ");
    };

    getUnit = () => {
        let res = {};

        for (let k in this.value) if (!this.value[k].omit) res[k] = this.value[k].getUnit();

        return res;
    };
}

class ArgsArray extends Args {
    constructor() {
        super("array", [...arguments]);
    }

    toString = () => this.value.map((x) => x.toString());

    // getUnit: () => this.value.map(x => x.getUnit());
}

class ArgsJSON extends Args {
    constructor(value: string) {
        super("json", value);

        if (typeof value !== "string") console.error("ArgsJSON expected string, but got", value);
    }

    toString = () => {
        if (!this.isValid()) {
            console.error(`invalid JSON ${this.value} on ArgsJSON`);
        } else return JSON.parse(this.value);
    };

    isValid = (): boolean => {
        try {
            JSON.parse(this.value);
        } catch (e) {
            return false;
        }

        return true;
    };
}

class ArgsError {
    isBad: boolean;
    intermediate: any;
    message: string;
    validator: (value: Args) => boolean;

    constructor(
        message: string,
        validator: (value: Args) => boolean,
        isBad: boolean = false,
        intermediate: any = null
    ) {
        this.isBad = isBad;
        this.intermediate = intermediate;
        this.message = message;
        this.validator = validator;
    }

    validOrNull(value: Args) {
        let valid = false;
        try {
            if (this.validator(value)) valid = true;
        } catch (e) {
            this.intermediate = value.value;
        }

        this.isBad = !valid;

        return valid ? value : null;
    }

    static useInstance = (message: string, validator?: (value: unknown) => boolean, isBad: boolean = true) => {
        const [$detected, detected] = useReducer(
            (_currentValue: boolean, value: Error | boolean): boolean => Boolean(value),
            isBad
        );

        const instance: ArgsError = useMemo(
            () =>
                new ArgsError(
                    message,
                    ({ value }) => {
                        const valid = validator ? validator(value) : !$detected;
                        detected(!valid);
                        return valid;
                    },
                    isBad
                ),
            []
        );

        useEffect(() => {
            instance.isBad = $detected;
        }, [$detected]);

        return { $detected, detected, instance };
    };
}

export { Args, ArgsString, ArgsAccount, ArgsNumber, ArgsBig, ArgsObject, ArgsArray, ArgsJSON, ArgsError };
