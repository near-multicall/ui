import { connect, keyStores, WalletConnection, transactions } from 'near-api-js';
import { getConfig } from '../near-config';
import BN from 'bn.js';

const searchParams = new URLSearchParams(window.location.hash.split('?')[1]);
window["ENVIRONMENT"] = searchParams.has("network")
    ? searchParams.get("network")
    : "testnet"
window["nearConfig"] = getConfig(window.ENVIRONMENT);

function initWallet(): Promise<WalletConnection> {
    return new Promise(resolve =>
        connect({
            ...window["nearConfig"],
            keyStore: new keyStores.BrowserLocalStorageKeyStore(),
            headers: {}
        }).then(near => resolve(new WalletConnection(near, 'near-multicall')))
    );
}

function tx(
    addr: string,
    func: string,
    args: any,
    gas: number,
    depo: string = "0"
) {
    const account = window?.["WALLET"]?.state.wallet.account();

    if (account == undefined) {
        console.error("Wallet not connected");
        return;
    }

    return account.signAndSendTransaction({
        receiverId: addr,
        actions: [
            transactions.functionCall(
                func,
                args,
                new BN(gas),
                new BN(depo)
            )
        ]
      });

}

function view(
    addr: string,
    func: string,
    args: any
) {
    const account = window?.["WALLET"]?.state.wallet.account();

    if (account == undefined) {
        console.error("Wallet not connected");
        return;
    }

    return account.viewFunction(
        addr, 
        func, 
        args
    )

}

export { initWallet, tx, view };