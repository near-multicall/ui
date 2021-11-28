import { ArgsString, ArgsAccount, ArgsNumber, ArgsArray, ArgsBig, ArgsObject } from "../../utils/args";
import Call from "../../utils/call";
import { toGas } from "../../utils/converter";
import BaseTask from "../base";

export default class Withdraw extends BaseTask {

    init(json = null) {

        const token = new ArgsAccount("nusdc.ft-fin.testnet");
        const tokens = [token];

        this.call = new Call({
            name: new ArgsString(json?.name ?? "Withdraw from Ref"),
            addr: new ArgsAccount(json?.addr ?? "multicall.lennczar.testnet"),
            func: new ArgsString(json?.func ?? "withderaw_from_ref"),
            args: new ArgsObject(json?.args 
                ? {
                    ref_adress: new ArgsString(json?.args.ref_adress),
                    tokens: new ArgsArray<ArgsAccount>(json?.args.tokens.map(t => new ArgsAccount(t))),
                    receiver_id: new ArgsAccount(json?.args.receiver_id),
                    withdrawl_gas: new ArgsNumber(json?.args.withdrawl_gas, 1, toGas(300), "gas"),
                    token_transfer_gas: new ArgsNumber(json?.args.token_transfer_gas, 1, toGas(300), "gas"),
                    deposit: new ArgsBig(json?.args.deposit, "1", null, "yocto")
                }
                : {
                    ref_adress: new ArgsString("ref-finance-101.testnet"),
                    tokens: new ArgsArray<ArgsAccount>(tokens),
                    receiver_id: new ArgsAccount(""),
                    withdrawl_gas: new ArgsNumber(toGas(55), 1, toGas(300), "gas"),
                    token_transfer_gas: new ArgsNumber(toGas(4), 1, toGas(300), "gas"),
                    deposit: new ArgsBig("1", "1", null, "yocto")                    
                }    
            ),
            gas: new ArgsNumber(json?.gas ?? toGas(95), 1, toGas(300), "gas"),
            depo: new ArgsBig(json?.depo ?? "0", "0", null, "yocto")
        });

    }

}