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
 * see: https://docs.near.org/api/rpc/contracts#call-a-contract-function
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
    // RPC returns JSON-serialized returns, needs parsing.
    return JSON.parse( String.fromCharCode(... response.result) );
}

/**
 * queries RPC for basic account information.
 * see: https://docs.near.org/api/rpc/contracts#view-account
 * 
 * @param accountId 
 */
async function viewAccount (accountId: string): Promise<{
    amount: string;
    locked: string;
    code_hash: string;
    storage_usage: number;
    storage_paid_at: number;
    block_height: number;
    block_hash: string
}> {
    const accountInfo: any = await rpcProvider.query({
        request_type: "view_account",
        finality: "final",
        account_id: accountId
    });

    return accountInfo;
}


export { tx, view, viewAccount, rpcProvider };
