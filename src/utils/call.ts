import {
    ArgsString, 
    ArgsAccount,
    ArgsNumber,
    ArgsBig, 
    ArgsObject
} from './args';

export default class Call {
    
    name: ArgsString;
    addr: ArgsAccount;
    func: ArgsString;
    args: ArgsObject;
    gas: ArgsNumber;
    depo: ArgsBig;

    constructor(
        name: ArgsString,
        addr: ArgsAccount,
        func: ArgsString,
        args: ArgsObject,
        gas: ArgsNumber,
        depo: ArgsBig
    ) {

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

}