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

    constructor(
        type: string, 
        value: any, 
        min?: number | BigInt | null, 
        max?: number | BigInt | null,
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

        console.log(value);

    }

    isValid = () => this.value.match(/^(?=.{2,64}$)(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/);

    toUrl = net => `https://wallet.near.org/profile/${this.value}`; // TODO: Add testnet

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

    big: BigInt;

    constructor(
        value: string, 
        min: string = null, 
        max: string = null, 
        unit?: string | null
    ) {

        super("big", value, (min !== null) ? BigInt(min) : null, (max !== null) ? BigInt(max) : null, unit);

        this.big = BigInt(value);

    }

    isValid = () => (!this.min || this.big >= this.min) && (!this.max || this.big <= this.max) 

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
            res[k] = this.value[k].toString();

        return JSON.stringify(res, null, "  ");

    }

}

class ArgsArray<T = ArgsString> extends Args {

    constructor(value: any) {

        super("array", value);

        console.log(value);

    }

    toString = () => console.log(this.value);// JSON.stringify(this.value.map(x => x.toString()), null, "  ");

}

class ArgsJSON extends Args {

    constructor(value: string) {

        super("json", value);

    }

    toString = () => {
        
        if (!this.isValid())
            console.error(`invalid JSON ${this.value}`);
        else
            return JSON.stringify(JSON.parse(this.value), null, "  ");

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