import { connect, keyStores, WalletConnection, transactions } from 'near-api-js';
import getConfig from '../config';
import BN from 'bn.js';

function initWallet() {
    return new Promise(resolve => {
        const url = new URL(window.location.href)
        window["ENVIRONMENT"] = url.searchParams.has("testnet")
            ? "testnet"
            : "mainnet"
        window.history.replaceState(null, "", new URL(window.location.href.split("?")[0]).searchParams.set("env", ENVIRONMENT))
        connect({
            ...getConfig(ENVIRONMENT),
            keyStore: new keyStores.BrowserLocalStorageKeyStore()
        }).then(near => resolve(new WalletConnection(near, 'near-multicall')));
    });
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