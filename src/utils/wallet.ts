// TODO: de-deprecate near-wallet on wallet selector. Use patch
import { providers } from "near-api-js";
import type { NetworkId } from "@near-wallet-selector/core";
import { getConfig } from '../near-config';
import { Base64 } from 'js-base64';



declare global {
    interface Window {
        NEAR_ENV: NetworkId
        nearConfig: any
    }
}

window.NEAR_ENV = <NetworkId> process.env.NEAR_ENV ?? "testnet";
window.nearConfig = getConfig(window.NEAR_ENV);
// create RPC Provider object.
const rpcProvider = new providers.JsonRpcProvider({
    url: window.nearConfig.nodeUrl
});


async function tx (
    addr: string,
    func: string,
    args: object | Uint8Array,
    gas: string,
    depo: string = "0"
): Promise<any> {
    // is user logged in?
    if ( !window.selector.isSignedIn() ) {
        console.error("Wallet not connected");
        // create & return empty promise
        return Promise.resolve();
    }

    // get wallet from wallet selector
    const wallet = await window.selector.wallet();
    return wallet.signAndSendTransaction({
        receiverId: addr,
        actions: [{
            type: "FunctionCall",
            params: {
                methodName: func,
                args: args,
                gas: gas,
                deposit: depo,
            }
        }]
    });
}

/**
 * make view calls using RPC, no need for user to sign in.
 * 
 * @param addr 
 * @param func 
 * @param args 
 * @returns 
 */
async function view (
    addr: string,
    func: string,
    args: object
): Promise<any> {
    const encodedArgs: string = Base64.encode( JSON.stringify(args) );
    // returns response object
    const response: any = await rpcProvider.query({
        request_type: "call_function",
        finality: "final",
        account_id: addr,
        method_name: func,
        args_base64: encodedArgs,
    });
    // RPC returns JSON-serialized, needs parsing.
    // Fix "Maximum call stack size exceeded" for large response data. See: https://stackoverflow.com/a/49124600
    const strResult = (<Array<number>> response.result).reduce((data, byte) => data + String.fromCharCode(byte), '');
    return JSON.parse(strResult);
}


export { tx, view, rpcProvider };
