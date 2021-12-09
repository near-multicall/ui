import { Base64 } from 'js-base64';
import {
    ArgsString, 
    ArgsAccount,
    ArgsNumber,
    ArgsBig, 
    ArgsObject,
    ArgsJSON
} from './args';

export default class Call {
    
    name: ArgsString;
    addr: ArgsAccount;
    func: ArgsString;
    args: ArgsObject | ArgsJSON;
    gas: ArgsNumber;
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
        gas: ArgsNumber,
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
            "addr": this.addr.toString(),
            "func": this.func.toString(),
            "args": this.args.toString(),
            "gas": this.gas.toString(),
            "depo": this.depo.toString()
        });

    }

    toJSON() {

        return {
            "addr": this.addr.toString(),
            "func": this.func.toString(),
            "args": JSON.parse(this.args.toString()),
            "gas": this.gas.toString(),
            "depo": this.depo.toString()
        }

    }

    toBase64() {

        return {
            "addr": this.addr.toString(),
            "func": this.func.toString(),
            "args": Base64.encode(JSON.stringify(JSON.parse(this.args.toString()))),
            "gas": this.gas.toString(),
            "depo": this.depo.toString()
        }

    }

}