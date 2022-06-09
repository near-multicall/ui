import * as nearAPI from "near-api-js";
import { getConfig } from '../near-config';
import { baseDecode } from "borsh";
import { Base64 } from 'js-base64';



declare global {
    interface Window {
        NEAR_ENV: string
        nearConfig: any
        near: nearAPI.Near
        walletAccount: nearAPI.WalletConnection
        account: nearAPI.ConnectedWalletAccount
    }
}

const searchParams = new URLSearchParams(window.location.hash.split('?')[1]);
window.NEAR_ENV = searchParams.has("network")
    ? searchParams.get("network")!
    : "testnet"
window.nearConfig = getConfig(window.NEAR_ENV);

/**
 * init connection to NEAR
 * init wallet based account
 * 
 * @returns wallet connection object
 */
async function initNear (): Promise<nearAPI.WalletConnection> {
    // Initializing connection to the NEAR node.
    window.near = await nearAPI.connect(
        Object.assign(
            {
                deps: {
                    keyStore: new nearAPI.keyStores.BrowserLocalStorageKeyStore()
                }
            },
            window.nearConfig
        )
    )

    // Initializing Wallet based Account.
    window.walletAccount = new nearAPI.WalletAccount(window.near, null)
    window.account = window.walletAccount.account()

    return window.walletAccount;
}

function tx (
    addr: string,
    func: string,
    args: object | Uint8Array,
    gas: number,
    depo: string = "0"
): Promise<void> {
    // is user logged in?
    if ( !window.walletAccount.isSignedIn() ) {
        console.error("Wallet not connected");
        // create & return empty promise
        return Promise.resolve();
    }

    const preTXs: Promise<nearAPI.transactions.Transaction>[] = [];
    const actions: nearAPI.transactions.Action[] = [];

    actions.push( nearAPI.transactions.functionCall(func, args, gas, depo) )
    preTXs.push( makeTransaction(addr, actions) )
    const TXs = Promise.all(preTXs)

    return passToWallet([ TXs ]);
}

async function view (
    addr: string,
    func: string,
    args: object
): Promise<any> {
    // query the RPC for view methods
    const encodedArgs: string = Base64.encode( JSON.stringify(args) );
    // returns response object
    const response: any = await window.near.connection.provider.query({
        request_type: "call_function",
        finality: "final",
        account_id: addr,
        method_name: func,
        args_base64: encodedArgs,
    });
    // RPC returns JSON-serialized returns, needs parsing.
    return JSON.parse( String.fromCharCode(... response.result) );
}

async function makeTransaction (
    receiverId: string,
    actions: nearAPI.transactions.Action[],
    nonceOffset = 1
): Promise<nearAPI.transactions.Transaction> {
    const [accessKey, block] = await Promise.all([
        window.account.accessKeyForTransaction(receiverId, actions),
        window.near.connection.provider.block({ finality: "final" })
    ])

    if (!accessKey) {
        throw new Error(`Cannot find matching key for transaction sent to ${receiverId}`)
    }

    const blockHash = baseDecode(block.header.hash)

    const publicKey = nearAPI.utils.PublicKey.from(accessKey.public_key)
    const nonce = accessKey.access_key.nonce + nonceOffset

    return nearAPI.transactions.createTransaction(
        window.account.accountId,
        publicKey,
        receiverId,
        nonce,
        actions,
        blockHash
    )
}

// Takes array of Transaction Promises and redirects the user to the wallet page to sign them.
async function passToWallet (preTXs: Promise<nearAPI.transactions.Transaction[]>[]): Promise<void> {
    const TXs = await Promise.all(preTXs)
    window.walletAccount.requestSignTransactions({
        transactions: TXs.flat(),
        callbackUrl: window.location.href
    })
}

export { initNear, tx, view, passToWallet };
