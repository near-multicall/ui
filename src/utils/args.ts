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
    min: number | null;
    max: number | null;
    unit: string | null;

    constructor(
        type: string, 
        value: any, 
        min?: number | null, 
        max?: number | null,
        unit?: string | null
    ) {

        // test if type is valid
        if (!Object.keys(this.types).includes(type))
            console.error(`invalid args type ${type}.`);
        
        this.type = type;
        this.value = value;
        this.min = min;
        this.max = max;
        this.unit = unit;

    }

    toString = () => this.value.toString();

}

class ArgsString extends Args {

    constructor(value: string) {

        super("string", value);

    }

}

class ArgsAccount extends Args {

    constructor(value: string) {

        super("string", value);

        if (!ArgsAccount.isValid(value))
            console.error(`invalid accountID ${value}`);

    }

    static isValid = (value: string) => value.match(/^(?=.{2,64}$)(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/);

    toUrl = net => `https://wallet.near.org/profile/${super.value}`; // TODO: Add testnet

}

class ArgsNumber extends Args {

    constructor(
        value: number, 
        min?: number | null, 
        max?: number | null, 
        unit?: string | null
    ) {

        super("number", value, min, max, unit);

    }

}

class ArgsBig extends Args {

    constructor(
        value: string, 
        min?: string | null, 
        max?: string | null, 
        unit?: string | null
    ) {

        super("big", value, null, null, unit);

        if (min != null || max != null)
            console.warn(`min & max parameter for ArgsBig not yet implemented.`);

    }

}

class ArgsObject extends Args {

    constructor(value: object) {

        super("object", value);

        for (let k in value)
            if (!(value[k] instanceof Args))
                console.error(`all childs of ArgsObject need to be of type Args (or extending Args)`)

    }

    toString = () => {

        let res = {};

        for (let k in super.value)
            res[k] = super.value[k].toString();

        return res;

    }

}

class ArgsArray<T = string> extends Args {

    constructor(value: Array<T>) {

        super("array", value);

    }

    toString = () => super.value.map(x => x.toString());

}

class ArgsJSON extends Args {

    constructor(value: string) {

        super("json", value);

        if (!ArgsJSON.isValid(value))
            console.error(`invalid JSON ${value}`);

    }

    static isValid = (value: string) => {

        try {
            JSON.parse(value);
        } catch(e) {
            return false;
        }

        return true;

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
    ArgsJSON
}