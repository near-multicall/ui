import { Base64 } from 'js-base64';
import { convert } from "./converter";

import {
    ArgsString, 
    ArgsAccount,
    ArgsBig, 
    ArgsObject,
    ArgsJSON
} from './args';

export class Call {
    
    name: ArgsString;
    addr: ArgsAccount;
    func: ArgsString;
    args: ArgsObject | ArgsJSON;
    gas: ArgsBig;
    depo: ArgsBig;

    constructor({
        name,
        addr,
        func,
        args,
        gas,
        depo
    }: {
        name: ArgsString,
        addr: ArgsAccount,
        func: ArgsString,
        args: ArgsObject | ArgsJSON,
        gas: ArgsBig,
        depo: ArgsBig
    }) {

        this.name = name;
        this.addr = addr;
        this.func = func;
        this.args = args;
        this.gas = gas;
        this.depo = depo;

    }

    toString() {

        return JSON.stringify({
            "address": this.addr.toString(),
            "actions": [{
                "func": this.func.toString(),
                "args": JSON.stringify(this.args.toString(), null, "  "),
                "gas": convert(this.gas.value, this.gas.unit).toString(),
                "depo": convert(this.depo.value, this.depo.unit).toString()
            }]
        });

    }

    toJSON() {

        return {
            "address": this.addr.toString(),
            "actions": [{
                "func": this.func.toString(),
                "args": this.args.toString(),
                "gas": convert(this.gas.value, this.gas.unit).toString(),
                "depo": convert(this.depo.value, this.depo.unit).toString()
            }]
        }

    }

    toBase64() {

        return {
            "address": this.addr.toString(),
            "actions": [{
                "func": this.func.toString(),
                "args": Base64.encode(JSON.stringify(this.args.toString())),
                "gas": convert(this.gas.value, this.gas.unit).toString(),
                "depo": convert(this.depo.value, this.depo.unit).toString()
            }]
        }

    }

    toUnits() {

        return {
            "address": this.addr.getUnit(),
            "actions": [{
                "func": this.func.getUnit(),
                "args": this.args.getUnit(),
                "gas": this.gas.getUnit(),
                "depo": this.depo.getUnit()
            }]
        }

    }

}

export class BatchCall extends Call {

    calls: Call[] = [];

    constructor() {

        super({
            name: new ArgsString("Batch"),
            addr: new ArgsAccount(""),
            func: new ArgsString(""),
            args: new ArgsObject({}),
            gas: new ArgsBig(0),
            depo: new ArgsBig(0)
        });

    }

    setCalls(calls: Call[]) {

        this.addr = calls[0].addr;
        this.calls = calls;

    }

    toString() {

        return JSON.stringify({
            "address": this.addr.toString(),
            "actions": this.calls.map(c => ({
                "func": c.func.toString(),
                "args": JSON.stringify(c.args.toString(), null, "  "),
                "gas": convert(c.gas.value, c.gas.unit).toString(),
                "depo": convert(c.depo.value, c.depo.unit).toString()
            }))
        });

    }

    toJSON() {

        return {
            "address": this.addr.toString(),
            "actions": this.calls.map(c => ({
                "func": c.func.toString(),
                "args": c.args.toString(),
                "gas": convert(c.gas.value, c.gas.unit).toString(),
                "depo": convert(c.depo.value, c.depo.unit).toString()
            }))
        }

    }

    toBase64() {

        return {
            "address": this.addr.toString(),
            "actions": this.calls.map(c => ({
                "func": c.func.toString(),
                "args": Base64.encode(JSON.stringify(c.args.toString())),
                "gas": convert(c.gas.value, c.gas.unit).toString(),
                "depo": convert(c.depo.value, c.depo.unit).toString()
            }))
        }

    }

    toUnits() {

        return {
            "address": this.addr.getUnit(),
            "actions": this.calls.map(c => ({
                "func": c.func.getUnit(),
                "args": c.args.getUnit(),
                "gas": c.gas.getUnit(),
                "depo": c.depo.getUnit()
            }))
        }

    }

}