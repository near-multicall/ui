import { connect, keyStores, WalletConnection, transactions } from 'near-api-js';
import getConfig from '../config';
import BN from 'bn.js';

window["ENVIRONMENT"] = 'testnet';

function initWallet() {
    return new Promise(resolve => {
        connect({
            ...getConfig(window["ENVIRONMENT"] || 'development'),
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

export { initWallet, tx };