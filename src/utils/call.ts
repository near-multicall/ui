import { Base64 } from 'js-base64';
import { convert } from "./converter";

import {
    ArgsString, 
    ArgsAccount,
    ArgsBig, 
    ArgsObject,
    ArgsJSON
} from './args';

export default class Call {
    
    name: ArgsString;
    addr: ArgsAccount;
    func: ArgsString;
    args: ArgsObject | ArgsJSON;
    gas: ArgsBig;
    depo: ArgsBig;
    omit: boolean;

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
        this.omit = false;

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